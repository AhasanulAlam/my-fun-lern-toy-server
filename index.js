const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zgkvxtd.mongodb.net/?retryWrites=true&w=majority`;

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

        const alltoysCollection = client.db('myFunLearnToy').collection('alltoys');

        //Create Index
        const indexKeys = { name: 1 };
        const indexOptions = { name: "name" };
        const result = await alltoysCollection.createIndex(indexKeys, indexOptions);

        // Get all the data
        app.get('/alltoys', async (req, res) => {
            const cursor = alltoysCollection.find().limit(20);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get specific data by id
        app.get('/toy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                // Include only the fields in the returned document required
                projection: {
                    picture_url: 1,
                    name: 1,
                    seller_name: 1,
                    seller_email: 1,
                    sub_category: 1,
                    price: 1,
                    rating: 1,
                    available_quantity: 1,
                    created_by: 1,
                    description: 1
                },
            };
            const result = await alltoysCollection.findOne(query, options);
            res.send(result);
        });


        // Get specific MyToys data by id to update
        app.get('/updatetoy/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await alltoysCollection.findOne(query);
            res.send(result);
        });



        // Get all data by user
        app.get('/mytoys', async (req, res) => {
            let query = {};

            if (req.query?.created_by) {
                query = { created_by: req.query.created_by }
            }
            const result = await alltoysCollection.find(query).sort({ price: -1 }).toArray();
            res.send(result);
        })


        // Add new data in database
        app.post('/addToy', async (req, res) => {
            const newToy = req.body;
            console.log(newToy);
            const result = await alltoysCollection.insertOne(newToy);
            res.send(result);
        });


        // Update an existing toy data
        app.put('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedToy = req.body;
            console.log(updatedToy);
            const setUpdatedToy = {
                $set: {
                    picture_url: updatedToy.picture_url,
                    name: updatedToy.name,
                    seller_name: updatedToy.seller_name,
                    seller_email: updatedToy.seller_email,
                    sub_category: updatedToy.sub_category,
                    price: updatedToy.price,
                    rating: updatedToy.rating,
                    available_quantity: updatedToy.available_quantity,
                    created_by: updatedToy.created_by,
                    description: updatedToy.description
                },
            };
            const result = await alltoysCollection.updateOne(filter, setUpdatedToy, options);
            res.send(result);
        })

        // Delete a Toy of loggedIn user
        app.delete('/mytoys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await alltoysCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })

        //Searching route
        app.get("/searchToysByName/:text", async (req, res) => {
            const searchText = req.params.text;
            const result = await alltoysCollection
                .find({name: { $regex: searchText, $options: "i" }})
                .toArray();
            res.send(result);
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('My Fun Learn Toy is Running...');
});

app.listen(port, () => {
    console.log(`MyFunLearnToy Server is running on port: ${port}`);
});

