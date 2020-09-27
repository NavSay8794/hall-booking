// importing express
const express = require('express');
const app = express();

// adding mongodb and client
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const dbUrl = 'mongodb://localhost:27017/halls';

//including body parser and using it
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/all', (req, res) => {
    mongoClient.connect(dbUrl, (err, client) => {
        if (err) throw err;
        let db = client.db('halls')
        let cursor = db.collection('rooms').find().toArray()
        cursor.then((data) => {
            res.json({
                status: 200,
                data: data
            })
            client.close()
        })
    })
})

app.post('/create-room', (req, res) => {
    console.log(req.body)
    mongoClient.connect(dbUrl, (err, client) => {
        if (err) throw err;
        let db = client.db('halls');
        console.log(req.body)
        let poster = db.collection('rooms').insertOne(req.body)
        poster.then((insertedData) => {
            res.json({
                status: 200,
                message: 'Room Successfully Created',
                data: insertedData
            })
            client.close()
        })
    })
})

app.put('/book-room/:id', (req, res) => {
    mongoClient.connect(dbUrl, async (err, client) => {
        if (err) throw err;
        let db = client.db('halls');
        let record = await db.collection('rooms').findOne({ _id: mongodb.ObjectID(req.params.id)})        
        if (record.isBooked == false) {
            let updater = db.collection('rooms').updateOne({ _id: mongodb.ObjectID(req.params.id) }, { $set: { bookedData: [req.body], isBooked: true } })
            updater.then((updatedData) => {
                res.json({
                    status: 200,
                    data: updatedData.ops
                })
                client.close()
            })
        } else {
            record.bookedData.forEach(x =>  {
                if ((req.body.Date === x.Date) && ((req.body.start_time >= x.start_time) || (req.body.start_time <x.end_time)
                    || (req.body.end_time > x.start_time) || (req.body.end_time <= x.end_time))) {
                    res.json({
                        status: 404,
                        message: 'Current Slot Already Booked'
                    })
                    client.close()
                } else {
                    let updater = db.collection('rooms').updateOne({ _id: mongodb.ObjectID(req.params.id) }, { $push: { bookedData: req.body } })
                    updater.then((updatedData) => {
                        res.json({
                            status: 200
                        })
                        client.close()
                    })
                }
            })
        }
    })
})

app.get('/all-Booked' ,async (req,res)=>{
    mongoClient.connect(dbUrl, async(err, client)=>{
        if(err) throw err;
        let db = client.db('halls')
        let bookedRooms = await db.collection('rooms').find({isBooked: true},{room_name:1, "isBooked":1, "bookedData":1,"_id":0}).toArray()
            res.json({
                status: 200,
                data: bookedRooms
            })
            client.close()
        })
})

app.get('/customers-booked', async (req,res)=>{
    mongoClient.connect(dbUrl, async (err,client)=>{
        if(err) throw err;
        let db = client.db('halls')
        let customers = await db.collection('rooms').find({isBooked:true}, {"_id":0}).toArray()             
        res.json({
            status:200,
            data: customers
        })
        client.close()
    })
})

app.listen((process.env.PORT||3000), () => {
    console.log('Server is up and running')
})