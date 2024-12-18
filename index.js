const express=require('express')
const cors=require('cors')
const app=express()
const port=process.env.PORT||3000
app.use(cors({
  origin:['http://localhost:5173','https://auth-mohamilon-2.web.app','https://auth-mohamilon-2.web.app'],
  credentials:true,
}))
const jwt = require('jsonwebtoken');
app.use(express.json())
require('dotenv').config();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mq5kn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//

const logger=(req,res,next)=>{
  console.log("inside the logger");
  next()
}
const verifyToken=(req,res,next)=>{
  console.log('inside verify token ',req.cookies)
  const token=req.cookies?.token
  if(!token){
    return res.status(401).send({message:"Unothorised Domain"})
  }
  jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message:"Unothorised Access"})
    }
  req.user=decoded

    next();

  })

}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
  // await client.connect();
    // Send a ping to confirm a successful connection
 // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  const jobscollection =client.db('JobPortals').collection('jobs')
  const jobAppycollection =client.db('JobPortals').collection('jobApplication')
    app.get('/jobs',async(req,res)=>{
      const result = await jobscollection.find({}).toArray();
      console.log("Jobs fetched:", result); // Debugging
      res.send(result);
    })
    app.get('/jobs/:id',async(req,res)=>{
      const id=req.params.id
        const query={_id:new ObjectId(id)}
        const result= await jobscollection.findOne(query)

      res.send(result);
    })
//job application api 
app.post('/job-application',async(req,res)=>{
  const application=req.body
   const result= await jobAppycollection.insertOne(application)
   /// get job applicant
   const id=application.jobid
   const query={_id:new ObjectId(id)}
   const job=await jobscollection.findOne(query)
   let newcount=0
   if(job.applicationCount){
 newcount=job.applicationCount+1
   }
   else if (!job.applicationCount){
    newcount=1
   }
   //now update job infu 
   const filter={_id:new ObjectId(id)}
   const updateDoc = {
    $set: {
      applicationCount:newcount
    },
  };
  const updateresult=await jobscollection.updateOne(filter,updateDoc)
   res.send(updateresult)
})
//my application 
app.get('/job-application', verifyToken, async(req,res)=>{

  const email=req.query.email
  const query={
applicant_email:email}

if(req.user.email!==req.query.email){
return res.status(403).send({message:'forbiden access'})
} 
   const result= await jobAppycollection.find(query).toArray()
for(const application of result ){
  console.log(application.jobid)
  const query1={_id:new ObjectId(application.jobid)}
  const job= await jobscollection.findOne(query1)
 if(job){
  application.title=job.title,
  application.company=job.company
  application.company_logo=job.company_logo
 }
}
   res.send(result)
})
// user user whos appliyed job 
app.get('/job-application/jobs/:id',async(req,res)=>{
  const id=req.params.id
  const query={jobid:id}
  const result=await jobAppycollection.find(query).toArray()
  res.send(result)
})
// delete application
app.delete('/job-application/:id',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
   const result= await jobAppycollection.deleteOne(query)
   res.send(result)
})
// add job post 
app.post('/jobs',async(req,res)=>{
  const newjob=req.body 
  const result= await jobscollection.insertOne(newjob)
  res.send(result)
})
// get my created job
app.get('/my_jobs',logger,async(req,res)=>{
  console.log('now inside the other api callback');

  const email=req.query.email
console.log(email)
 
  const query={hr_email:email}

  
  const cursor=jobscollection.find(query)
  const result=await cursor.toArray()

  res.send(result)
})
// auth related api 
app.post('/jwt',async(req,res)=>{
  const user=req.body;
  const token=jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1h'});
  res
  .cookie('token',token,{
    httpOnly:true,
    secure:process.env.NODE_ENV === "production",
     // http://localhost:5173/signin

  })
  // const cookieOptions = {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  // };
.send({success:true})
})

//remove cokkie after logout
app.post('/logout',(req,res)=>{
  res.clearCookie('token',{
    httpOnly:true,
    secure:process.env.NODE_ENV === "production",
  
  })
  res.send({success:true})
})


//delete my created  jobs
 app.delete('/jobs/:id',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const result= await jobscollection.deleteOne(query)
  res.send(result)
 
 })
//update status
app.patch('/job-application/:id',async(req,res)=>{
  const id=req.params.id
  const data=req.body;
  const filter={_id:new ObjectId(id)}
  const updateDoc = {
    $set: {
      status:data.status
    },
  };
   const result= await jobAppycollection.updateOne(filter,updateDoc)
   res.send(result)
})
  }
   finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('job is falling from the  sky')
})
app.listen(port,()=>{
    console.log(`job is waiting at :${port}`)
})