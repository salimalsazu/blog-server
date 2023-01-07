const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 8000

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Loan Application')
})


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    // console.log("Bearer Header", authHeader);

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }

        req.decoded = decoded;
        next();
    })

}





//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@portfolio.zka99gz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    const usersCollection = client.db('users').collection('user');
    const blogsCollection = client.db('users').collection('blogs');
    const categoryCollection = client.db('users').collection('category');

    try {

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const userEmail = await usersCollection.findOne(query);
            res.send(userEmail)
        })


        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const userId = await usersCollection.findOne(query);
            // console.log(userId);
            res.send(userId);
        })

        app.get('/users', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            // console.log('inside review', decoded)

            if (decoded.email !== req.query?.email) {

                return res.status(403).send({ message: 'unauthorized access' })
            }

            // if (decoded.email === req.query?.email) {

            //     console.log(decoded.email)
            //     console.log(req.query.email)
            // }

            let query = {}

            if (req.query?.email) {
                query = {
                    email: req.query?.email
                }
            }

            // console.log("QUERY", query)

            const cursor = await usersCollection.find(query).toArray();

            // console.log("CURSOR", cursor)
            res.send(cursor);

        })



        app.get('/recentpost', async (req, res) => {
            const query = {}
            const cursor = blogsCollection.find(query).sort({ current: -1 });
            const post = await cursor.toArray();
            res.send(post);
        })


        app.get('/category', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query).sort({ current: -1 });
            const category = await cursor.toArray();
            res.send(category);
        })

        app.get('/allblogs', async (req, res) => {
            const search = req.query.search;
            let query = {}
            console.log(search)
            if (search.length) {
                query = {
                    $text: {
                        $search: search
                    }
                }
            }
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const cursor = blogsCollection.find(query).sort({ current: -1 });
            const result = await cursor.skip(page * size).limit(size).toArray();
            const count = await blogsCollection.estimatedDocumentCount();
            res.send({ count, result });

        })

        app.get('/blogs', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            // console.log('inside review', decoded)

            if (decoded.email !== req.query?.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {}


            if (req.query?.email) {
                query = {
                    email: req.query?.email
                }
            }


            const cursor = await blogsCollection.find(query).toArray();
            res.send(cursor);

        })




        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        })


        app.post('/category', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result);
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })


    }

    finally {

    }


}

run().catch(error => console.error(error))







app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})