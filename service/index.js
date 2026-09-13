const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const app = express();
const DB = require('./database.js');
const { peerProxy } = require('./peerProxy.js');
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

const salt = bcrypt.genSaltSync(10);
const authCookieName = 'token';

//Used with .filter() on FlatArrays
const UNIQUE_VALUES = (value, index, self) => self.indexOf(value) === index
const UNIQUE_OBJECTS = (value, index, self) => self.findIndex(obj => obj.toString() === value.toString()) === index;

let apiRouter = express.Router();
app.use(`/api`, apiRouter);

const port = process.argv.length > 2 ? process.argv[2] : 3000;

apiRouter.post('/auth/create', async (req, res) => {
    if (await findUser('email', req.body.email) || await findUser('username', req.body.username)) {
        res.status(409).send({msg: 'Existing user'});
    } else {
        const user = await createUser(req.body);
        setAuthCookie(res, user.token);
        res.send({username: user.username});
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    const user = await findUser('username', req.body.username);
    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            user.token = uuid.v4();
            await DB.updateUser(user)
            setAuthCookie(res, user.token);
            res.send({username: user.username});
            return;
        }
    }
    res.status(401).send({msg: 'Unauthorized'});
});

apiRouter.get('/auth/username', async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        res.send({username: user.username})
    } else {
        res.status(202).end()
    }
})

apiRouter.delete('/auth/logout', async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        delete user.token;
        await DB.updateUser(user)
    }
    res.clearCookie(authCookieName);
    res.status(204).end();
});

const verifyAuth = async (req, res, next) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        next();
    } else {
        res.status(401).send({msg: 'Unauthorized'});
    }
};

apiRouter.post('/user/calendars', verifyAuth, async (req, res) => {
    const user = await findUser('username', req.body.username);
    const calendarId = req.body.calendar_id;
    await addCalendarToUser(user, DB.objectId(calendarId));
    res.status(200).send({username: user.username, calendars: user.calendars})
});

apiRouter.get('/users/calendars', verifyAuth, async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    const userCalendarIDs = (await findUserCalendars(user.calendars)).flatMap(calendar => calendar._id);
    const userCalendars = []
    for (const calendarID of userCalendarIDs) {
        userCalendars.push(await getCalendarAsObject(calendarID))
    }
    res.send(userCalendars)
})

apiRouter.get('/users/calendars/ids', verifyAuth, async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    const userCalendars = await findUserCalendars(user.calendars);
    res.send(userCalendars.flatMap(calendar => calendar._id))
})

apiRouter.get('/users/calendars/:calendarId', verifyAuth, async (req, res) => {
    const calendarID = req.params.calendarId;
    const calendar = await getCalendarAsObject(calendarID)
    res.send(calendar)
})

apiRouter.post('/calendars', verifyAuth, async (req, res) => {
    let user = await findUser('token', req.cookies[authCookieName])
    const calendar = await updateCalendars(req.body);
    await addCalendarToUser(user, calendar._id)
    res.send(calendar);
});

apiRouter.post('/calendar/times', verifyAuth, async (req, res) => {
    const calendar = await addTimeToCalendar(req.body);
    res.send(calendar);
});

apiRouter.delete('/calendar/:calendarId', verifyAuth, async (req, res) => {
    const calendarId = req.params.calendarId;
    await DB.deleteCalendar(calendarId)
    res.status(204).end();
});

apiRouter.post('/times', verifyAuth, async (req, res) => {
    const time = await updateTime(req.body);
    res.send(time);
});

apiRouter.post('/events', verifyAuth, async (req, res) => {
    const event = await updateEvents(req.body);
    res.send(event);
});

apiRouter.delete('/events/:eventId', verifyAuth, async (req, res) => {
    const eventId = req.params.eventId;
    await DB.deleteEvent(eventId);
    res.status(204).end();
});

app.use(function (err, req, res, next) {
    res.status(500).send({type: err.name, message: err.message});
});

app.use((_req, res) => {
    res.sendFile('index.html', {root: 'public'});
});

async function createUser(user) {
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const newUser = {
        email: user.email,
        username: user.username,
        password: hashedPassword,
        token: uuid.v4(),
        calendars: []
    };
    await DB.addUser(newUser);

    return newUser;
}

async function findUser(field, value) {
    if (!value) return null;

    return DB.getUser(field, value);
}

async function addCalendarToUser(user, calendars) {
    const userCalendars = user.calendars;
    userCalendars.push(calendars)
    user.calendars = userCalendars.flat().filter(UNIQUE_OBJECTS);
    await DB.updateUser(user);
    return user;
}

async function findUserCalendars(userCalendars) {
    const c = []
    for (const calendar of userCalendars) {
        c.push(await DB.getCalendar(calendar))
    }
    return c
}

//hehehehe good luck
async function getCalendarAsObject(calendarID) {
    const calendar = await DB.getCalendar(calendarID)
    const calendarTimes = calendar.event_times
    return {
        _id: calendarID,
        name: calendar.name,
        event_times: (calendarTimes.length > 0) ? (await Promise.all(calendarTimes.map(async (time) => {
            const eventTime = await DB.getTime(time);
            const eventIds = [eventTime.event_ids].flat()
            return {
                time: time,
                event_ids: (eventIds.length > 0) ? (await Promise.all(eventIds.map(async (eventId) => {
                    const event = await DB.getEvent(eventId)
                    return {
                        _id: eventId,
                        name: event.name,
                        description: event.description
                    }
                }))).flat() : []
            }
        }))).flat() : []
    }
}

async function updateCalendars(calendar) {
    if (calendar['_id'] !== undefined) {
        const previousCalendar = await DB.getCalendar(calendar['_id']);
        if (previousCalendar) {
            await DB.updateCalendar(calendar);
        } else {
            await DB.addCalendar(calendar);
        }
        return calendar
    } else {
        const newCalendar = {
            name: calendar.name,
            event_times: []
        }
        await DB.addCalendar(newCalendar);
        return newCalendar
    }
}

async function addTimeToCalendar(calendar) {
    const calendarID = calendar["_id"]
    const previousCalendar = await DB.getCalendar(calendarID)

    const times = previousCalendar["event_times"]
    times.push(calendar["event_times"])
    const updatedCalendar = {
        _id: previousCalendar._id,
        event_times: times.flat().filter(UNIQUE_VALUES)
    }
    await DB.updateCalendar(updatedCalendar);

    return updatedCalendar
}

async function updateTime(newTime) {
    const previousTime = await DB.getTime(newTime.time);

    if (previousTime) {
        const events = [previousTime["event_ids"]].flat()
        events.push(newTime["event_ids"])
        const updatedTime = {
            time: previousTime['time'],
            event_ids: events.flat().filter(UNIQUE_VALUES)
        }
        await DB.updateTime(updatedTime);
        return updatedTime;
    } else {
        await DB.addTime(newTime);
        return newTime;
    }
}

async function updateEvents(event) {
    if (event['_id'] !== undefined) {
        const previousEvent = DB.getEvent(event['_id']);
        if (previousEvent) {
            await DB.updateEvent(event);
        } else {
            await DB.addEvent(event);
        }
        return event
    } else {
        const newEvent = {
            name: event.name,
            description: event.description
        }
        await DB.addEvent(newEvent);
        return newEvent
    }
}

function setAuthCookie(res, authToken) {
    res.cookie(authCookieName, authToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
    });
}

const httpService = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

peerProxy(httpService);