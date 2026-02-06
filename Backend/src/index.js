const express = require('express')
const connectDb = require('./db/db')
const app = express();
app.get("/",(req,res)=>{
    res.send({message:"Welcome to Markaz Backend"})
})

const port = 5000;

app.listen(port, async()=>{
    console.log('...Listening on port',{port});
    await connectDb()
    })
