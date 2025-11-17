//it's widely used in production-grade 
// applications, including large-scale 
// applications. 
const asyncHandler =(requestHandler)=>{
    return (req,res,next)=>{
         requestHandler(req,res,next)
        .catch((err)=>next (err))
    }
}

export {asyncHandler}






/* 
asyncHandler is  the utility function
its higher order function takes function as an argument
and returns a new function. it returns a anonymous function that accepts the parameters
req,res and next 

Promise.resolve because its asynchrounous
Purpose of this function:
to reduce the boilerplate code when handling asynchrounous operations 
without this utility you would need to manually wrap every async route handler in a try-catch block to handle 
errors and pass them to next function.


Now How To Use The asyncHandler utility?

app.get('/api',asyncHandler(async(req,res.next)=>{
      const data = await someAsyncFunction();
      res.json(data);
}))

app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});

Now we have not explicitly write the code for try and catch
it will be doing by the utitity



*/















//higher order functions=>async function

// const asyncHandler =()=>()=>{}  or 
//function as a parameter
// const asyncHandler =(func)=>{()=>{}}
//instead of {} pass another arrow function like the above line

//MEHTOD 2
//its a wrapper function, it will make the coding easy


// const asyncHandler =(fn)=>async (req, res, next)=>{
//     try{
//         await fn(req,res,next);
//     }catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message: error.message
//         }) //set the default here user will pass the error.code
//     }
// }


