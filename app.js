/*** Modules ***/
const morgan = require('morgan');
const express = require('express');
const session = require("express-session");
const path = require('path');
const Utilisateur = require(path.join(__dirname,"model/User"));
const Reservation = require(path.join(__dirname, "model/Reservation"));

require('dotenv').config();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;
const debug = require('debug')('http');
const app = express();

/*** View engine setup  ***/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }))

//recquire for encrypt passwords
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: 'top secret',
    resave: true,
    saveUninitialized: true
}));

// middleware d'authentification
function auth(req, res, next) {
    if (req?.session?.user) {
        return next();
    }
    else {
        return res.sendStatus(401);
    }
}

//Definition of routeurs
const routerReservation= require(path.join(__dirname, "routes/reservationsRouter.js"));
const routerRessource= require(path.join(__dirname, "routes/ressourcesRouter.js"));
const routerUser= require(path.join(__dirname, "routes/usersRouter.js"));
const routerArchitecture= require(path.join(__dirname, "routes/architecturesRouter.js"));

app.use("/reservations", routerReservation);
app.use("/ressources", routerRessource);
app.use("/users", routerUser);
app.use("/architectures", routerArchitecture);


mongoose.connect(uri+"/node_bcrypt", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});



/*** PART :  CONNECTION & DECONNECTION  ***/
app.get('/', function(req, res) {
    if(req?.session?.user){
        res.redirect("/home");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/login', function(req, res) {
    res.render("login", {title: "Connexion"});
});

app.post("/login", async (req, res) => {
    try {
        const myUser = await Utilisateur.searchUser(req.body.login);
        debug(myUser);
        if (myUser) {
            const comparisonPwd = await bcrypt.compare(req.body.password, myUser.password);
            if (comparisonPwd) {
                debug("Auth Successful");
                req.session.user = {
                    login : myUser.login ,
                    firstname : myUser.firstname,
                    lastname : myUser.lastname,
                    administrator : myUser.administrator
                };
                res.redirect("/home");
            } else {
                res.render("login", {title: "Connexion", error: "Identifiants incorrects."});
            }
        } else {
            res.render("login", {title: "Connexion", error: "Identifiants incorrects."});
        }
    } catch (error) {
        res.status(401).send("Internal Server error Occured");
    }
});


app.get('/home', auth, async function(req, res) {
    res.render("calendar", {
        title: "Accueil",
        user: req.session.user,
        description : "Bonjour " + req.session.user.firstname+".  \nVous pourvez visualiser vos réservations par semaine. Cliquez sur l'id d'une des resrvations pour avoir plus d'informations.",
        reservations : await Reservation.getByUser(req.session.user.login),
    });
});

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.redirect("/login");
});


/*** Server Start  ***/
app.listen(port, () => {
    debug('HTTP sever listening on port'+port)
});

