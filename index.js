const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { verifyJwtSync } = require('aws-jwt-verify/jwt-rsa');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4cizlao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'Unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}

// mongodb Connection
async function run() {
    try {
        const servicesCollection = client.db('floraTheChef').collection('services');
        const itemsCollection = client.db('floraTheChef').collection('menu');
        const reviewsCollection = client.db('floraTheChef').collection('reviews'); 

        // JWT
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
            res.send({token});
        })

        // API
        app.get('/services', async(req, res) => {
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.limit(size).toArray();
            const count = await servicesCollection.estimatedDocumentCount()
            res.send({count, services })
        });
        app.post('/services',  async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.send(result);
        });
        app.get('/card', async(req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
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
            const items = await itemsCollection.findOne(query);
            res.send(items)
        });

        // reviews api
        app.get('/cardReviews', async (req, res) => {
           
            let query = {};
            if (req.query.service) {
                query = {
                    serviceId: req.query.service
                }
            }
            // console.log(query);
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            // console.log(reviews)
            res.send(reviews);
        });
    
        app.get('/myReviews',verifyJWT, async(req, res) => {
            const decoded = req.decoded;
            console.log(req.query.email)
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'Unauthorized access'})
            }
            let query ={};
            if (req.query.email){
                query = {
                    email:req.query.email
                }
            }
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/cardReviews/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id) };
            const cursor = await reviewsCollection.findOne(query);
            res.send(cursor);
        })

        app.get('/cardReviews', async (req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const myReview = await reviewsCollection.findOne(query);
            res.send(myReview);
        })
        app.put('/cardReviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id) };
            const myReview = req.body;
            const option = {upsert : true};
            const updatedUser = {
                $set: {
                    name: user.name,
                    address: user.address,
                    email: user.email
                }
            }
            const result = await userCollection.updateOne(query, updatedUser, option);
            res.send(result);
        })

        app.post('/cardReviews',  async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });
        app.patch('/cardReviews/:id',verifyJWT, async(req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = {_id:ObjectId(id)};
            const updatedDoc = {
                $set: {
                    status:status
                }
            }
            const result = await reviewsCollection.updateOne(query, updatedDoc);
            res.send(result);
        })
        app.delete('/cardReviews/:id',verifyJWT, async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await reviewsCollection.deleteOne(query);
            // console.log(result);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(err => console.error(err));



app.get('/', (req, res) => {
    res.send('Flora the chef server is running now on port 5000');
});

app.listen(port, () => { 
    console.log(`Flora the chef server running on the ${port}`);
})