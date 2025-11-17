class ApiError extends Error {
    constructor(
        statusCode,//jho bhi es constructor ko use karaga wo hume these things dega
        message = "Something went wrong",
        errors = [],
        stack = ""//error stack

    ){
        super(message)//to override this message
        this.statusCode = statusCode
        this.data = null //what is in this .data
        this.message = message
        this.errors = errors;
        this.success = false

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}

// Why do we use this.stack = stack?
// We use it to save the location of the error — where exactly in the code the error happened — so we can debug it easily later.

// Behind the scenes, the error will have a .stack that looks like:

// bash
// Copy code
// ApiError: User not found
//     at getUser (controllers/userController.js:8:13)
//     at asyncHandler (utils/asyncHandler.js:4:9)
// This tells you the exact file and line number where the error happened 📍

// Think of .stack like a receipt of how the error happened — which function called what.


//inside the curly braces in constructor we override things there

/*
ApiError class:
it is custom error class, handle api related errors in a structured way.
it extends the built-in error class

super(message)=> calls the constructor of the parent
stack Handling: If a stack trace is provided (via the stack parameter), it is used directly. 
If not, the Error.captureStackTrace method is used to capture the current stack trace, which is useful for debugging.

purpose of this class:
provide a standard way to handle and throw erros in an API context.

How to use it?
app.get('/some-endpoint', (req, res, next) => {
    try {
        // Some operation that might fail
        if (someConditionFails) {
            throw new ApiError(400, "Invalid input", ["Field X is required"]);
        }

        res.json({ success: true, data: someData });
    } catch (err) {
        next(err); // Passes the error to the error-handling middleware
    }
});





*/ 