//What is a class : class provides a stucturred manner to the objects inside of it
class AppError extends Error{
    constructor(message,statusCode,code){
        //As i'm calling the parent class object that is the message we user super keyword
        super(message);
        this.statusCode=statusCode;
        this.code=code;
        this.isOperational=true;
    }
}

module.exports=AppError;