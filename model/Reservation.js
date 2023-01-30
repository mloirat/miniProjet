const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const debug = require('debug')('http');

const args = process.argv.slice(2);
/*
const url = args[0] ?? 'mongodb://localhost:27017';
const dbName = args[1] ?? "odonnanceur";
const client = new MongoClient(url);
*/

const uri = process.env.MONGODB_URI;
const dbName =  process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});


const Reservation = {
    /*** Function to get a reservation by its id. ***/
    getById : async function (reservationId) {
        let reservations = await this.getAll();
        for(let k =0; k<reservations.length; k++){
            let idReservationSaved = reservations[k]._id;
            let myObjectId = new ObjectId(reservationId);
            if(myObjectId.equals(idReservationSaved)){
                return reservations[k];
            }
        }
    },

    /*** Function to get all reservations saved on the database. ***/
    getAll : async function(){
        return this.getReservations()
    },

    /*** Function to get a reservation by the user (login). ***/
    getByUser : async function(user) {
        let reservations = await this.getAll();
        let reservationsUser = [];
        for(let l=0; l<reservations.length; l++){
            let pseudo = reservations[l].user;
            if(user === pseudo){
                reservationsUser.push(reservations[l]);
            }
        }
        return reservationsUser;
    },

    /*** Function to get a reservation by its ressources. ***/
    getByRessource : async function(ressourceWanted) {
        let allReservations = await this.getAll();
        let reservationsOfRessource = [];
        let ressourceReservedOfReservation= [];
        for(let l=0; l<allReservations.length; l++){
            if(typeof (allReservations[l].ressources)==='string'){
                //type string, means that there is only one ressource, we need to translate in an Array to use forEach
                ressourceReservedOfReservation = Array.of(allReservations[l].ressources);
            }else {// type would be object, it means that there are many ressources in the reservations
                ressourceReservedOfReservation = allReservations[l].ressources;
            }
            ressourceReservedOfReservation.forEach(
                ressourceReserved => {
                    if(ressourceReserved===ressourceWanted){
                        reservationsOfRessource.push(allReservations[l]);
                    }
            });
        }
        return reservationsOfRessource;
    },

    /*** Function to get all the reservations of the database. ***/
    getReservations: async function() {
        //1 - Connection to the database.
        await client.connect();
        //2 - Selection of the database.
        const database = client.db(dbName);
        //3 - Selection of the collection.
        const reservationsCollection = database.collection('reservations');
        //4 - Get all documents.
        const reservations = await reservationsCollection.find().toArray();
        return reservations;
    },

    /*** Function to insert a reservation on the database.
     * arguments of the function :
     * - ressources wanted
     * - date of the beginning of the reservation
     * - date of the ending of the reservation
     * - user which is making the reservation
     ***/
    insert : function(ressources, dateBegin, dateEnd, user){
        const db = client.db(dbName);
        const reservationsCollections = db.collection('reservations');
        return reservationsCollections.insertOne(
            {
                ressources :  ressources,
                begin : dateBegin,
                end : dateEnd,
                user : user,
            });
    },

    /*** Function to delete the reservations of the database by its id. ***/
    delete : async function(id){
        const db = client.db(dbName);
        const reservationsCollections = db.collection('reservations');
        return await reservationsCollections.deleteOne({ _id :  ObjectId(id)})
    }

}

module.exports = Reservation;