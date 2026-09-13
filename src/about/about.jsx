import React from 'react';

export function About() {
    return (
        <main>
            <h1>Schedulizer</h1>
            <h3>A planner application designed for busy schedules and deadlines</h3>
            <p>
                Are you finding it hard to keep track of all the busy schedules and deadlines in your life? Then you
                need
                to try out Schedulizer.
            </p>
            <div className="container">
                <div className="row">
                    <div className="col-lg-1"></div>
                    <div className="col-lg-2">
                        <p>
                            Schedulizer is a simple planner application designed with deadlines, projects, and
                            meetings in mind. With Schedulizer, you can effectively plan out what projects you have,
                            when
                            they are due, and when you will work on them, allowing you to work in harmony with all the
                            other events that happen in life.
                        </p>
                        <p>
                            Working on a team? Schedulizer has you covered, with shared planners and features to help
                            you
                            coordinate with co-workers, teammates, friends, etc.!
                        </p>
                    </div>
                    <div className="col-lg-8">
                        <img alt="schedulizer-demo" src="/schedulizer_mockup.png" width="100%"/>
                    </div>
                </div>
            </div>
            <p>This is still currently a work in progress, more details will be added to this page as they become
                relevant.
                Check out the project on <a href="https://github.com/Ryan-Callahan/startup/tree/main">Github</a>!
            </p>
            <hr/>
        </main>
    );
}