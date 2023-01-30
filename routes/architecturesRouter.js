const express = require('express');
const router = express.Router();
const path = require('path');
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
 *  PART :  ACCESS OF ARCHITECTURE INFOS
 *
 ***/
router.get('/', auth, async (req,res)=>{
    res.render('architectures', {
        title : "Les architectures",
        architectures : await Architecture.getArchitectures(),
        user : req.session.user
    });
});

router.get('/card/:name', auth, async (req,res)=>{
    res.render('architectureCard', {
        title : "Information sur l'architecture "+req.params.name,
        architecture : await Architecture.getByName(req.params.name),
        user : req.session.user
    });
});


/***
 *
 *  PART :  CREATION OF ARCHITECTURE
 *
 ***/
router.get('/new', auth, (req,res)=>{
    res.render("architectureForm", {
        title: "Créer une architecture", user : req.session.user
    });
});

router.post('/new',  auth, async (req,res)=>{
    const { name } = req.body;
    let nameAccepted = await Architecture.isNameAvailable(name);
    if(nameAccepted){
        let result = await Architecture.insert(name);
        if(result.acknowledged === true){
            res.render("architectureForm", {
                title: "Créer une architecture",
                user: req.session.user,
                text: "L'architecture a bien été créée !"});
        }else{
            res.render("architectureForm", {
                title: "Créer une architecture",
                user: req.session.user,
                error : "Une erreur est survenue. Veuillez réassayer à nouveau."});
        }
    }else{
        res.render("architectureForm", {
            title: "Créer une architecture",
            user: req.session.user,
            error : "Le nom de l'architecture est déjà utilisée. Veuillez en renseigner un nouveau."});
    }
});


/***
 *
 *  PART :  DELETE OF ARCHITECTURE
 *
 ***/
router.get('/delete', auth , async (req,res)=>{
    res.render('architectureFormDelete', {
        title : "Supprimer une architecture",
        user : req.session.user,
        architectures : await Architecture.getArchitectures(),
    });
});

router.post('/delete', auth , async (req,res)=>{
    const { architectureSearched } = req.body;
    const architectureExist = await Architecture.getByName(architectureSearched);
    if(architectureExist){
        let result = await Architecture.delete(architectureSearched);
        if(result.acknowledged === true){
            res.render('architectureFormDelete', {
                title : "Supprimer une architecture",
                user : req.session.user,
                architectures : await Architecture.getArchitectures(),
                text : "L'architecture a bien été supprimée."
            });
        }else{
            res.render('architectureFormDelete', {
                title : "Supprimer une architecture",
                user : req.session.user,
                architectures : await Architecture.getArchitectures(),
                error : "Une erreur est survenue. L'architecture n'a pas pu être supprimée."
            });
        }
    }else {
        res.render('architectureFormDelete', {
            title : "Supprimer une architecture",
            user : req.session.user,
            architectures : await Architecture.getArchitectures(),
            error : "L'architecture n'existe pas. Veuillez saisir un nouveau nom."
        });
    }
});

module.exports= router;
