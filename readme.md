# NodeJS RESTFul Api

Updated: 1/2/2019

This is an ongoing project where I build a NodeJS application from scratch with no dependencies.

1. Hello Api

## Install and Run it
Simply clone the repo and run the node command in the terminal:

    node index

You should see the message that the server is running:

### In Dev mode

    Http server listening on port 3000
    Https server listening on port 3001

### In Prod mode

    Http server listening on port 5000
    Https server listening on port 5001

Open Postman and navigate to `http://localhost:3000/hello`.  You should see:

    {
        "message": "Hello Pirple!"
    }

If you POST and object with a name property, you'll see that change the message:

    {
        "name": "John"
    }

This will show the message:

    {
        "message": "Hello John!"
    }

If you add a QUERYSTRING parameter such as:

    http://localhost:3000/hello?name=Frank

... you'll see:

    {
        "message": "Hello Frank!"
    }

Have fun!
