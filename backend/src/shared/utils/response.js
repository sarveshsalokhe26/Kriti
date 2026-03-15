/*
*Functions to return Structed responses to the user for better understanding of the error and success responses  
*/
function successResponse(res,data=null,message=null,statusCode=200){
    return res.status(statusCode).json({
        status:"Success",
        message,
        data
    });
}

function errorResponse(res,code,message,statusCode=400){
    return res.status(statusCode).json({
        status:"Error",
        code,
        message,
    });
}

module.exports={
    successResponse,
    errorResponse
}