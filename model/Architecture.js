const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const args = process.argv.slice(2);
/*
const url = args[0] ?? 'mongodb://localhost:27017';
const dbName = args[1] ?? "odonnanceur";
const client = new MongoClient(url); */

const uri = process.env.MONGODB_URI;
const dbName =  process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});


const Architecture = {

    /*** Function to get an architecture from the database by its id.***/
    getById : async function (architectureId) {
        let architectures = await this.getAll();
        for(let k =0; k<architectures.length; k++){
            let idArchi = architectures[k]._id;
            if(architectureId.equals(idArchi)){
                return architectures[k];
            }
        }
    },

    /*** Function to get all architectures of the database.***/
    getAll : async function(){
        return this.getArchitectures()
    },

    /*** Function to get all architectures of the database.***/
    getArchitectures: async function() {
        //1 - Connection to the database.
        await client.connect();
        //2 - Selection of the database.
        const database = client.db(dbName);
        //3 - Selection of the collection.
        const architecturesCollection = database.collection('architectures');
        //4 - Get all documents.
        const architectures = await architecturesCollection.find().toArray();
        return architectures;
    },

    /*** Function to check is the name is already all architectures of the database.***/
    isNameAvailable : async function(name) {
        let allArchitectures = await this.getAll();
        for(let l=0; l<allArchitectures.length; l++){
            if(name === allArchitectures[l].name){
                return false;
            }
        }
        return true;
    },

    /*** Function to get an architecture by its name. ***/
    getByName : async function(nameSearched) {
        let architectures = await this.getAll();
        for(let l=0; l<architectures.length; l++){
            if(nameSearched === architectures[l].name){
                return architectures[l];
            }
        }
        return false;
    },

    /*** Function to insert an architecture on the database. ***/
    insert : function(name){
        const db = client.db(dbName);
        const architecturesCollection = db.collection('architectures');
        return architecturesCollection.insertOne(
            {
            name : name,
            })
    },

    /*** Function to delete an architecture on the database. ***/
    delete : function(nameToDelete){
        const db = client.db(dbName);
        const architecturesCollection = db.collection('architectures');
        return architecturesCollection.deleteOne({ name :  nameToDelete})
    }

}

module.exports = Architecture;
