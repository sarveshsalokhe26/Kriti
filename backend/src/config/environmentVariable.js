// writing a function to retrieve the env variable centrally

const { error } = require("winston");

function getEnv(key,required=true){
    const value = process.env[key];

    if(!value && required){
        throw new Error(`The env variable is not available ${key}`); //throwing error if the env variable is not declared
    }

    return value; //returning the env variable value after accessing it 
};

//exporting the file so that we can access the function whereever we want
module.exports={
    getEnv,
};
    
