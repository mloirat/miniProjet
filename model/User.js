
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const Reservation = require("./Reservation");
require('dotenv').config();
const args = process.argv.slice(2);
/*
const url = args[0] ?? 'mongodb://localhost:27017';
const dbName = args[1] ?? "odonnanceur";
const client = new MongoClient(url);
*/

const uri = process.env.MONGODB_URI;
const dbName =  process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});

/*
const args = process.argv.slice(2);
const uri = args[0] ?? process.env.MONGODB_URI;
const dbName = args[1] ?? process.env.BDD_NAME;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology:true, serverApi: ServerApiVersion.v1});
*/
const User = {
    /*** Function to get all user of the database. ***/
    getUsers: async function() {
        //1 - Connection of the database.
        await client.connect();
        //2 - Selection of the database.
        const database = client.db(dbName);
        //3 - Selection of the collection.
        const usersCollection = database.collection('users');
        //4 - Get all documents.
        return await usersCollection.find().toArray();
    },

    /*** Function to get all user of the database. ***/
    searchUser : async function(login) {
        let allUsers = await this.getUsers();
        for(let l=0; l<allUsers.length; l++){
            let pseudo = allUsers[l].login;
            if(login === pseudo){
                return allUsers[l];
            }
        }
        return false;
    },

    /*** Function to verifiy is the login already exist on the database.***/
    isLoginAvailable : async function(login) {
        let allUsers = await this.getUsers();
        for(let l=0; l<allUsers.length; l++){
            let pseudo = allUsers[l].login;
            if(login === pseudo){
                return false;
            }
        }
        return true;
    },

    /*** Function to insert a user on the database. ***/
    insert : function(login, mdp, admin, newLastName, newFirstname){
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        return usersCollection.insertOne({
            login :  login,
            password : mdp,
            administrator : admin,
            lastname : newLastName,
            firstname : newFirstname,
        })
    },

    /*** Function to delete a user of the database. ***/
    delete : async function (loginToDelete) {
        const db = client.db(dbName);
        const allReservationsOfUser = await Reservation.getByUser(loginToDelete);
        //erase all the reservation of the user before remove it
        for (let l = 0; l < allReservationsOfUser.length; l++) {
           await Reservation.delete(allReservationsOfUser[l]._id);
        }
        //remove user
        const usersCollection = db.collection('users');
        return await usersCollection.deleteOne({login: loginToDelete})
    }
}

module.exports = User;
