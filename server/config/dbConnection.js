import mongoose from "mongoose";
mongoose.set('strictQuery',false);
const connectionTodb=async()=>{
    try{
        const {connection}=await mongoose.connect(
        process.env.MONGO_URI
        );

        if(connection){
        console.log(`connected to mongoDb:${connection.host}`);
        }
        
    } catch(e) {
        console.log(e);
        process.exit(1);
        
    }
  
}
export default connectionTodb;