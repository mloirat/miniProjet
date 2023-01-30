const express = require('express');
const router = express.Router();
const path = require('path');
const Reservation = require(path.join(__dirname, "../model/Reservation"));
const Utilisateur = require(path.join(__dirname,"../model/User"));
const Ressource = require(path.join(__dirname,"../model/Ressource"));
const Architecture = require(path.join(__dirname,"../model/Architecture"));


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
 *  PART :  ACCESS OF RESSOURCES INOFS
 *
 ***/
router.get('/', auth, async (req,res)=>{
    res.render('ressources', {
        title : "Disponibilité des ressources",
        user : req.session.user
    });
});

router.post('/', auth, async (req,res)=>{
    let {dateBegin, dateEnd} = req.body;
    if(new Date(dateEnd)<=new Date(dateBegin)  ){
        res.render('ressources', {
            title : "Disponibilité des ressources",
            user : req.session.user,
            error : "La sélection des dates de réservations ne sont pas valides (date antérieure à celle actuelle ou date de fin antérieure à celle de début). \n Veuillez faire une sélection valide."
        });
    }else{
        let allRessourcesSaved = await Ressource.getRessources();
        let allRessourcesAvailable = [];
        for(let i =0; i< allRessourcesSaved.length; i++){
            let reservationsOfRessource = await Reservation.getByRessource(allRessourcesSaved[i].name);
            let ressourceAvailable = true;
            for(let j =0; j< reservationsOfRessource.length; j++){
                let isAvailable = await Ressource.isAvailableDuringThisPeriod(reservationsOfRessource[j],dateBegin, dateEnd);
                if(!isAvailable){
                    ressourceAvailable = false;
                }
            }
            if(ressourceAvailable){
                allRessourcesAvailable.push(allRessourcesSaved[i]);
            }
        }
        res.render('ressources', {
            title : "Disponibilité des ressources",
            ressourcesAvailable: allRessourcesAvailable,
            user : req.session.user,
        });
    }
});

router.get('/card/:name', auth, async (req,res)=>{
    res.render('ressourceCard', {
        title : "Information sur la ressource "+req.params.name,
        ressource : await Ressource.getByName(req.params.name),
        user : req.session.user
    });
});



/***
 *
 *  PART :  CREATION OF RESSOURCES
 *
 ***/
router.get('/new',  auth, async (req,res)=>{
    res.render("ressourceForm", {
        title: "Créer une ressource",
        user : req.session.user,
        architectures : await Architecture.getArchitectures()});
});

router.post('/new',  auth, async (req,res)=>{
    const { name , nameArchitecture, hearts, ram } = req.body;
    let nameAccepted = await Ressource.isNameAvailable(req.body.name);
    if(nameAccepted){
        let architecture = await Architecture.getByName(nameArchitecture);
        let result = await Ressource.insert(name, architecture, hearts, ram);
        if(result.acknowledged === true){
            res.render("ressourceForm", {
                title: "Créer une ressource",
                user : req.session.user,
                architectures : await Architecture.getArchitectures(),
                text: "La ressource a bien été enregistrée !"
            });
        }else{
            res.render("ressourceForm", {
                title: "Créer une ressource",
                user : req.session.user,
                architectures : await Architecture.getArchitectures(),
                error : "Une erreur est survenue. Veuillez réassayer à nouveau."
            });
        }
    }else{
        res.render("ressourceForm", {
            title: "Créer une ressource",
            user : req.session.user,
            architectures : await Architecture.getArchitectures(),
            error : "Le nom de la ressource est déjà utilisé. Veuillez en renseigner un nouveau."
        });
    }
});



/***
 *
 *  PART :  DELETE OF RESERVATION
 *
 ***/
router.get('/delete', auth , async (req,res)=>{
    res.render('ressourceFormDelete', {
        title : "Supprimer une ressource",
        utilisateurs : await Utilisateur.getUsers(),
        user : req.session.user,
        ressources : await Ressource.getRessources(),
    });
});

router.post('/delete', auth , async (req,res)=>{
    const { ressourceSearched } = req.body;
    const ressourceExist = await Ressource.getByName(ressourceSearched);
    if(ressourceExist){
        let result = await Ressource.delete(ressourceSearched);
        if(result.acknowledged === true){
            res.render('ressourceFormDelete', {
                title : "Supprimer une ressource",
                user : req.session.user,
                ressources : await Ressource.getRessources(),
                text : "La ressource a bien été supprimée."
            });
        }else{
            res.render('ressourceFormDelete', {
                title : "Supprimer une ressource",
                user : req.session.user,
                ressources : await Ressource.getRessources(),
                error : "Une erreur est survenue. La ressource n'a pas pu être supprimée."
            });
        }
    }else {
        res.render('ressourceFormDelete', {
            title : "Supprimer une ressource",
            user : req.session.user,
            ressources : await Ressource.getRessources(),
            error : "La ressource n'existe pas. Veuillez saisir un nouveau nom."
        });
    }
});


module.exports= router;