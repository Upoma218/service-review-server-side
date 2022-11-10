const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4cizlao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesCollection = client.db('floraTheChef').collection('services');
        const itemsCollection = client.db('floraTheChef').collection('menu');
        // const reviewsCollection = client.db('floraTheChef').collection('reviews'); 

        // API
        app.get('/services', async(req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services)
        });
        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const service = await servicesCollection.findOne(query);
            res.send(service)
        });
        app.get('/items', async(req, res) => {
            const query = {};
            const cursor = itemsCollection.find(query);
            const items = await cursor.toArray();
            res.send(items)
        });
        app.get('/items/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const service = await itemsCollection.findOne(query);
            res.send(service)
        });

    }
    finally {

    }
}
run().catch(err => console.error(err));



app.get('/', (req, res) => {
    res.send('Flora the chef server is running on port 5000');
});

app.listen(port, () => { 
    console.log(`Flora the chef server running on the ${port}`);
})