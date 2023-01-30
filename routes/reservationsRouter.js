const express = require('express');
const router = express.Router();
const path = require('path');
const Reservation = require(path.join(__dirname, "../model/Reservation"));
const Ressource = require(path.join(__dirname,"../model/Ressource"));

// middleware d'authentification
function auth(req, res, next) {
    if (req?.session?.user) {
        return next();
    }
    else {
        return res.sendStatus(401);
    }
}


/***
 *
 *  ACCESS OF RESERVATION INFOS
 *
 ***/
router.get('/', auth, async (req,res)=>{
    res.render('reservations', {
        title : "Mes reservations",
        reservations : await Reservation.getByUser(req.session.user.login),
        user : req.session.user
    });
});

router.post('/',  auth, async (req,res)=>{
    const { idResa } = req.body;
    let result = await Reservation.delete(idResa);
    if(result.acknowledged === true){
        res.render('reservations', {
            title : "Mes reservations",
            user : req.session.user,
            reservations : await Reservation.getByUser(req.session.user.login),
            text : "La reservation a bien été supprimée"
        });
    }else{
        res.render('reservations', {
            title : "Mes reservations",
            user : req.session.user,
            reservations : await Reservation.getByUser(req.session.user.login),
            error : "Une erreur est survenue. Veuillez réessayer."
        });
    }
});

router.get('/card/:name', auth, async (req,res)=>{
    res.render('reservationCard', {
        title : "Information de la reservation",
        reservation : await Reservation.getById(req.params.name),
        user : req.session.user
    });
});

router.get('/calendar/global', auth, async function(req, res) {
    res.render("calendar", {
        title: "Calendrier global",
        user: req.session.user,
        description : "Voici toutes les réservations effectuées dans l'ordonnanceur. Cliquez sur l'id d'une des resrvations pour avoir plus d'informations.",
        reservations : await Reservation.getReservations(),
    });
});


/***
 *
 *  PART :  CREATION OF RESERVATION
 *
 ***/
router.get('/new',  auth, async(req,res)=>{
    res.render('reservationForm', {
        title : "Faire une réservation",
        user : req.session.user,
        ressources : await Ressource.getRessources()
    });
});

router.post('/new',  auth, async (req,res)=>{
    const { ressources, dateBegin, dateEnd } = req.body;
    if(typeof (ressources)==='undefined'){
        res.render('reservationForm', {
            title : "Faire une réservation",
            user : req.session.user,
            ressources : await Ressource.getRessources(),
            error : "Veuillez sélectionner au moins une ressource."
        });
    }else{
        let ressourcesWanted =[];
        if(typeof (ressources)==='string'){
            //type string, means that there is only one ressource, we need to translate in an Array
            ressourcesWanted = Array.of(ressources);
        }else {
            // type would be object, it means that there are many ressources in the reservations
            ressourcesWanted = ressources;
        }
        let dateValid = await isValid(new Date(dateBegin), new Date(dateEnd));
        if(!dateValid){
            //dates are not valides, user needs to put new ones
            res.render('reservationForm', {
                title : "Faire une réservation",
                user : req.session.user,
                ressources : await Ressource.getRessources(),
                error : "La sélection des dates de réservations ne sont pas valides (date antérieure à celle actuelle ou date de fin antérieure à celle de début). \n Veuillez faire une sélection valide."
            });
        }
        let dateOk = await isPossible(ressourcesWanted, new Date(dateBegin), new Date(dateEnd));
        if (dateOk) {
            let result = await Reservation.insert(ressourcesWanted, dateBegin, dateEnd, req.session.user.login);
            if (result.acknowledged === true) {
                res.render('reservationForm', {
                    title : "Faire une réservation",
                    user : req.session.user,
                    ressources : await Ressource.getRessources(),
                    text : "La réservation a bien été enregistrée !"
                });
            } else {
                res.render('reservationForm', {
                    title : "Faire une réservation",
                    user : req.session.user,
                    ressources : await Ressource.getRessources(),
                    error : "Une erreur est survenue. Veuillez réassayer à nouveau."
                });
            }
        } else {
            res.render('reservationForm', {
                title : "Faire une réservation",
                user : req.session.user,
                ressources : await Ressource.getRessources(),
                error : "La réservation est déjà prise à cette date là. Veuillez en choisir une nouvelle."
            });
        }
    }

});

/***
 * Function to validate the date of reservation. To check :
 * - if the reservation is posterior of the current date
 * - if the beginning date is before the ending date
 *
 * If one of this two conditions is not validated, return false.
 ***/
async function isValid(beginning, ending){
    if(Date.now()>beginning){
        return false;
    }else if(ending<beginning){
        return false;
    }else{
        return true;
    }
}

/***
 * Function to validate if the reservation can be done.
 * To check if the ressources wanted ar not already reserved in a another resrevation
 * during the time wanted.
 *
 * If one of the ressources is not available return false.
 ***/
async function isPossible(ressourcesWanted, dateWantedBeg, dateWantedEnd) {
    let allReservationsSaved = await Reservation.getAll();
    for (let i = 0; i < allReservationsSaved.length; i++) {
        let beginning = new Date(allReservationsSaved[i].begin);
        let end = new Date(allReservationsSaved[i].end);
        let ressourcesReserved = allReservationsSaved[i].ressources;
        for(let j =0; j< ressourcesWanted.length; j++){
            if(ressourcesReserved.includes(ressourcesWanted[j].toString())){
                if (beginning <= dateWantedBeg && dateWantedBeg <= end) {
                    return false;
                } else if (beginning <= dateWantedEnd && dateWantedEnd <= end) {
                    return false;
                } else if (dateWantedBeg <= beginning && end <= dateWantedEnd) {
                    return false;
                }
            }
        }
    }
    return true;
}


module.exports= router;
