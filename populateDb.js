const { MongoClient, ServerApiVersion} = require('mongodb');
const bcrypt = require("bcrypt");
const debug = require('debug')('http');

require('dotenv').config();
const uri =  process.env.MONGODB_URI;
const dbName = process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});


async function main() {
    await client.connect();
    console.log(`Connected successfully to MongoDB server: ${uri}`);
    console.log(`Inserting data into database: ${dbName}`);

    await insertData(dbName);
    return 'done.';
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());


function insertData(dbName){
    let promises = [];
    const db = client.db(dbName);

    const usersCollection = db.collection('users');
    const saltRounds=10;
    promises.push(
        bcrypt.hash("admin0", saltRounds).then(
            res => {
                usersCollection.insertOne({
                    login: 'admin0',
                    password: res,
                    administrator: 1,
                    lastname: 'Loirat',
                    firstname: 'Marie',
                })
        })
        );

    const   architectures  = ['AMD', 'INTEL', 'ARM', 'Rpi3'];
    const architecturesCollection = db.collection('architectures');
    for(const architecture of architectures){
        promises.push(
            architecturesCollection.insertOne({name : architecture})
        );
    }

    const ressourcesCollection = db.collection('ressources');
    promises.push(
        ressourcesCollection.insertOne({
                name : "RaspberryPi",
                architecture: "ARM",
                hearts : 1,
                ram : "1Go"
            })
        )

    const reservationsCollections = db.collection('reservations');
    promises.push(
        reservationsCollections.insertOne(
        {
            ressources :  "RaspberryPi",
            begin : '2023-01-22T14:00',
            end : '2023-01-22T17:00',
            user : 'admin0',
        })
    )

    return Promise.all(promises);
}