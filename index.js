const express=require('express')
const cors=require('cors')
const app=express()
const port=process.env.PORT||3000
app.use(cors())
app.use(express.json())
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mq5kn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
   await client.connect();
    // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
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
app.get('/job-application',async(req,res)=>{
  const email=req.query.email
  const query={
applicant_email:email}
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
app.get('/my_jobs',async(req,res)=>{
  const email=req.query.email
console.log(email)
 
  const query={hr_email:email}

  
  const cursor=jobscollection.find(query)
  const result=await cursor.toArray()

  res.send(result)
})
// 
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