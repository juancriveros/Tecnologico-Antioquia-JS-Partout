require('./config/config');
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const directorioPublico = path.join(__dirname, '../Public');

const directorioBootstrap = path.join(__dirname, '../node_modules/bootstrap/dist/css');
const directorioJSBootstrap = path.join(__dirname, '../node_modules/bootstrap/dist/js');
const directorioJquery = path.join(__dirname, '../node_modules/jquery/dist');
const directorioPopper = path.join(__dirname, '../node_modules/popper.js/dist');

app.use(express.static(directorioPublico));
app.use('/bootstrap', express.static(directorioBootstrap));
app.use('/bootstrapjs', express.static(directorioJSBootstrap));
app.use('/jquery', express.static(directorioJquery));
app.use('/popper', express.static(directorioPopper));



app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))


app.use((req, res, next) => {
	if(req.session.usuario){
		res.locals.sesion = true
		res.locals.admin = req.session.admin
		res.locals.usuario = req.session.usuario
		res.locals.nombre = req.session.nombre
	}
	next()
})


app.use(bodyParser.urlencoded({extended:false}));
app.use(require('./routes/index'));




mongoose.connect('mongodb://localhost:27017/JsPartout', {useNewUrlParser: true}, (err, result) => {
	if(err)
		return console.log("Error al conectarse");

	console.log("conectado correctamente");
});
app.listen(process.env.PORT, () => { 
	console.log('servidor en el puerto ' + process.env.PORT);
})