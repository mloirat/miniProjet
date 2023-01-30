const express = require('express');
const router = express.Router();
const path = require('path');
const Reservation = require(path.join(__dirname, "../model/Reservation"));
const User = require(path.join(__dirname,"../model/User"));
const bcrypt = require("bcrypt");
const saltRounds = 10;

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
 *  PART :  ACCESS INFOS USERS
 *
 ***/
router.get('/', auth , async (req,res)=>{
    res.render('userForm', {
        title : "Recherche utilisateur",
        utilisateurs : await User.getUsers(),
        user : req.session.user
    });
});

router.post('/', auth , async (req,res)=>{
    const { userSearched } = req.body;
    const userExist = await User.searchUser(userSearched);
    if(userExist){
        res.render('userCard', {
            title : "Profil de : "+userSearched,
            reservations : await Reservation.getByUser(userSearched),
            userOfSearch : userExist,
            user : req.session.user
        });
    }else {
        res.render('userForm', {
            title : "Recherche utilisateur ",
            utilisateurs : await User.getUsers(),
            user : req.session.user,
            error : "L'utilisateur n'existe pas. Veuillez en saisir un nouveau."
        });
    }
});

router.get('/card/:login', auth , async (req,res)=>{
    res.render('userCard', {
        title : "Profil de : "+req.params.login,
        reservations : await Reservation.getByUser(req.params.login),
        userOfSearch : await User.searchUser(req.params.login),
        user : req.session.user
    });
});


/***
 *
 *  PART :  CREATION OF USERS
 *
 ***/
router.get('/register', auth, async function(req, res) {
    res.render("register", {
        title: "Ajouter un compte",
        user : req.session.user,
    });
});

router.post("/register", async (req, res) => {
    let loginAccepted = await User.isLoginAvailable(req.body.login);
    if(loginAccepted){
        try {
            const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
            console.log(hashedPwd);
            const insertResult = await User.insert(req.body.login, hashedPwd, req.body.administrator, req.body.nom, req.body.prenom);
            if(insertResult.acknowledged===true){
                res.render("register", {
                    title: "Ajouter un compte",
                    user : req.session.user,
                    text : "Le compte a bien été créé !"
                });
            }else {
                res.render("register", {
                    title: "Ajouter un compte",
                    user : req.session.user,
                    error : "Le compte n'a pas été créé, une erreur est survenue. Veuillez réessayer à nouveau."
                });
            }
        } catch (error) {
            res.render("register", {
                title: "Ajouter un compte",
                user : req.session.user,
                error : "Erreur 500 : Une erreur serveur est survenue. Le compte n'a pas été créé. Veuillez réessayer à nouveau."
            });
        }
    }else{
        res.render("register", {
            title: "Ajouter un compte",
            user : req.session.user,
            error : "Le login est déjà utilisé. Veuillez en renseigner un nouveau."
        });
    }
});


/***
 *
 *  PART :  DELETE OF USERS
 *
 ***/
router.get('/delete', auth , async (req,res)=>{
    res.render('userFormDelete', {
        title : "Supprimer un utilisateur ",
        user : req.session.user,
        usersSaved : await User.getUsers()
    });
});

router.post('/delete', auth , async (req,res)=>{
    const { userSearched } = req.body;
    const userExist = await User.searchUser(userSearched);
    if(userExist){
        let result = await User.delete(userSearched);
        if(result.acknowledged === true){
            res.render('userFormDelete', {
                title : "Supprimer un utilisateur",
                user : req.session.user,
                usersSaved : await User.getUsers(),
                text : "L'utilisateur a bien été supprimé."
            });
        }else{
            res.render('userFormDelete', {
                title : "Supprimer un utilisateur",
                user : req.session.user,
                usersSaved : await User.getUsers(),
                error : "Une erreur est survenue. L'utilisateur n'a pas pu être supprimé."
            });
        }
    }else {
        res.render('userFormDelete', {
            title : "Supprimer un utilisateur",
            user : req.session.user,
            usersSaved : await User.getUsers(),
            error : "L'utilisateur n'existe pas. Veuillez en saisir un nouveau."
        });
    }
});

module.exports= router;
