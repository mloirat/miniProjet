const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const args = process.argv.slice(2);
/*
const url = args[0] ?? 'mongodb://localhost:27017';
const dbName = args[1] ?? "odonnanceur";
const client = new MongoClient(url);
*/
const path = require("path");
const Reservation = require(path.join(__dirname, "Reservation"));

const uri = process.env.MONGODB_URI;
const dbName =  process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});


const Ressource = {

    /*** Function to get a ressource from the database by the id. ***/
    getById : async function (ressourceId) {
        let ressources = await this.getAll();
        for(let k =0; k<ressources.length; k++){
            let idRessource = ressources[k]._id;
            if(ressourceId.equals(idRessource)){
                return ressources[k];
            }
        }
    },

    /*** Function to get all ressources from the database. ***/
    getAll : async function(){
        return this.getRessources()
    },

    /*** Function to get all ressources from the database. ***/
    getRessources: async function() {
        //1 - Connection of the database.
        await client.connect();
        //2 - Selection of the database.
        const database = client.db(dbName);
        //3 - Selection of collections.
        const ressourcesCollection = database.collection('ressources');
        //4 - Get all documents.
        const ressources = await ressourcesCollection.find().toArray();
        return ressources;
    },

    /*** Function to check is the name is already use for another ressource on the database. ***/
    isNameAvailable : async function(name) {
        let allRessources = await this.getAll();
        for(let l=0; l<allRessources.length; l++){
            if(name === allRessources[l].name){
                return false;
            }
        }
        return true;
    },

    /*** Function to get a ressource from the database by the name. ***/
    getByName : async function(nameSearched) {
        let ressources = await this.getAll();
        for(let l=0; l<ressources.length; l++){
            if(nameSearched === ressources[l].name){
                return ressources[l];
            }
        }
        return false;
    },

    /*** Function to check that the ressource is avalaible during the period with the reservation.
     * arguments :
     * - reservation to check
     * - date of the beginning of the period to check
     * - date of the ending of the period to check
     ***/
    isAvailableDuringThisPeriod : async function (reservation, dateWantedBeg, dateWantedEnd){
        /*** Conversion of dates in order to compare them ***/
        let begResa = new Date(reservation.begin);
        let endResa = new Date(reservation.end);
        let begWanted = new Date(dateWantedBeg);
        let endWanted = new Date(dateWantedEnd);
        if (begResa <= begWanted && begWanted <= endResa) {
            return false;
        } else if (begResa <= endWanted && endWanted <= endResa) {
            return false;
        } else if (begWanted <= begResa && endResa <= endWanted) {
            return false;
        }
        return true;
    },

    /*** Function to insert a ressource on the database
     * - name of the new ressource
     * - architecture of the new ressource
     * - number of hearts of the new ressource
     * - ram of the new ressource
     ***/
    insert : function(name, architecture, hearts, ram){
        const db = client.db(dbName);
        const ressourcesCollection = db.collection('ressources');
        return ressourcesCollection.insertOne(
            {
            name : name,
            architecture: architecture,
            hearts : hearts,
            ram : ram+"Go"
            })
    },

    /*** Function to delete a ressource from the database using its name. ***/
    delete : function(nameToDelete){
        const db = client.db(dbName);
        const ressourcesCollection = db.collection('ressources');
        return ressourcesCollection.deleteOne({ name :  nameToDelete})
    }

}

module.exports = Ressource;