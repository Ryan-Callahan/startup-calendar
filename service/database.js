const {MongoClient, ObjectId} = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('schedulizer');
const calendarsCollection = db.collection('calendars');
const usersCollection = db.collection('users');
const timesCollection = db.collection('times');
const eventsCollection = db.collection('events');

(async function testConnection() {
    try {
        await db.command({ping: 1});
        console.log(`Connect to database`);
    } catch (ex) {
        console.log(`Unable to connect to database with ${url} because ${ex.message}`);
        process.exit(1);
    }
})();

async function addUser(user) {
    await usersCollection.insertOne(user);
}

function getUser(field, value) {
    return usersCollection.findOne({[field]: value});
}

async function updateUser(user) {
    await usersCollection.updateOne({email: user.email}, {$set: user});
}

async function deleteUser(user) {
    await usersCollection.deleteOne({email: user.email})
}

async function addCalendar(calendar) {
    await calendarsCollection.insertOne(calendar);
}

async function getCalendar(calendarID) {
    return calendarsCollection.findOne({_id: new ObjectId(calendarID)});
}

async function updateCalendar(calendar) {
    await calendarsCollection.updateOne({_id: calendar._id}, {$set: calendar});
}

async function deleteCalendar(calendarId) {
    let calId = new ObjectId(calendarId);
    await calendarsCollection.deleteOne({_id: calId})
    const users = usersCollection.find({calendars: calId})
    for await (const user of users) {
        const calendars = [user.calendars].flat().filter(id => !id.equals(calId));
        await updateUser({
            email: user.email,
            calendars: calendars
        })
    }
}

async function addTime(time) {
    await timesCollection.insertOne(time);
}

//this should probably be added on to the calendar it belongs to instead of creating a brand-new object
function getTime(time) {
    return timesCollection.findOne({time: time});
}

async function updateTime(time) {
    await timesCollection.updateOne({time: time.time}, {$set: time});
}

async function deleteTime(time) {
    await timesCollection.deleteOne({time: time})
    const calendars = await calendarsCollection.find({event_times: time}).toArray();
    for (const calendar of calendars) {
        try {
            const eventTimes = [calendar.event_times].flat().filter(t => t !== time);
            await updateCalendar({
                _id: calendar._id,
                event_times: eventTimes
            })
        } catch (err) {
            console.log(`Error deleting time ${time} from calendar ${calendar._id}:`, err);
        }
    }
}

async function addEvent(event) {
    await eventsCollection.insertOne(event);
}

function getEvent(event) {
    return eventsCollection.findOne({_id: new ObjectId(event)})
}

async function updateEvent(event) {
    await eventsCollection.updateOne({_id: event._id}, {$set: event});
}

async function deleteEvent(eventId) {
    await eventsCollection.deleteOne({_id: new ObjectId(eventId)});
    const times = await timesCollection.find({event_ids: eventId}).toArray();
    for (const time of times) {
        try {
            const eventIds = [time.event_ids].flat().filter(id => id !== eventId)
            if (eventIds.length > 0) {
                await updateTime({
                    time: time.time,
                    event_ids: eventIds
                })
            } else {
                await deleteTime(time.time)
            }
        } catch (err) {
            console.log(`Error deleting time ${time.time} from event ${eventId}:`, err)
        }
    }
}

function objectId(objectId) {
    return new ObjectId(objectId);
}

module.exports = {
    addUser,
    getUser,
    updateUser,
    deleteUser,
    addCalendar,
    getCalendar,
    updateCalendar,
    deleteCalendar,
    addTime,
    getTime,
    updateTime,
    deleteTime,
    addEvent,
    getEvent,
    updateEvent,
    deleteEvent,
    objectId
}