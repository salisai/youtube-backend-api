class ApiResponse {
    constructor(statusCode, data,message){
       this.statusCode = statusCode
       this.data = data
       this.message = message
       this.success = statusCode < 400 
    }
}

export { ApiResponse }

//why to use this?
//1. consistency: By using this class, all your API responses will have a consistent structure, making it easier for clients (like frontend applications) to handle responses predictably.
//2. Clarity: It clearly separates the different parts of the response (status code, data, message, and success indicator), making it easy to understand and debug.
//3. Convenience: It simplifies the creation of API responses. Instead of manually creating response objects throughout your code, you can instantiate this class with the necessary information.
//4. simplicity
//5. readiblilty:


//SECOND WAY AND BEST WAY
// class ApiResponse {
//     constructor(statusCode, data = null,message = null){
//        this.statusCode = statusCode
//        this.data = data
//        this.message = message || this.getDefaultMessage(statusCode)
//        this.success = statusCode < 400 
//     }

//     isSuccess(statusCode){
//         return statusCode >= 200 && statusCode <400
//     }

//     getDefaultMessage(statusCode) {
//         const statusMessages = {
//             200: "OK",
//             201: "Created",
//             204: "No Content",
//             400: "Bad Request",
//             401: "Unauthorized",
//             403: "Forbidden",
//             404: "Not Found",
//             500: "Internal Server Error",
//           };

//           return statusMessages[statusCode] || "Unknown status";
//     }
// }

// export { ApiResponse }


// How to use this
// app.get('/example', (req, res) => {
//     const data = { id: 1, name: 'Example Item' };
//     const response = new ApiResponse(200, data, 'Data retrieved successfully');
//     res.status(response.statusCode).json(response);
// });

