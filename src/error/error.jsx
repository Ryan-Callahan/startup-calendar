import React from 'react';

export function Error({errorMessage}) {
    return (
        <>
            <div className="error-window">
                <h1>We have encountered an error!</h1>
                <h2>{errorMessage}</h2>
                <div className="box">
                    <h2>MY BALLS ITCH</h2>
                    <img alt="hank schrader" src="/hanktoilet1.jpg" width="69%"/>
                    <h2>BOTTOM TEXT</h2>
                </div>
            </div>

            <br/>
            <hr/>
        </>
    );
}