const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const Usuario = require('./../models/usuarios');
const Curso = require('./../models/cursos');
const Inscrito = require('./../models/inscritos');
const fs = require('fs');

const directorioListadoCursos = path.join(__dirname, '../listadoCursos.json');
const directorioListadoEstudiantes = path.join(__dirname, '../listadoEstudiantes.json');
const directorioListadoInscritos = path.join(__dirname, '../listadoInscritos.json');
const directioPartial = path.join(__dirname, '../../template/Partials');
const directioViews = path.join(__dirname, '../../template/views');

require('./../helpers/helpers');
require('./../helpers/cursos');
const estudiante = [];

app.set('view engine', 'hbs');
app.set('views', directioViews);
hbs.registerPartials(directioPartial);

function ObtenerCursos(admin, res, req, extra)
{
	var query;
	var rol;
	if (admin){
		Rol = 'Admin'
		Curso.find({}).exec((err,result) => {
			if(err){
				return res.render('VerCursos', {
					CursoCreado: err
				});
			}
			res.render('VerCursos', {
				cursos: result,
				Rol : Rol, 
				CursoCreado : extra,
				activos : result.filter(x => x.estado == "Disponible"),
				sesion : true,
				nombre : req.session.nombre,
				usuario : req.session.usuario, 
				admin : true
			});
		})
	}
	else{
		Rol = 'Interesado'

		Curso.find({estado : 'Disponible'}).exec((err,result) => {
			if(err){
				return res.render('VerCursos', {
					CursoCreado: err
				});
			}

			res.render('VerCursos', {
				cursos: result,
				Rol : Rol, 
				CursoCreado : extra,
				sesion : true,
				nombre : req.session.nombre,
				usuario : req.session.usuario, 
				admin : false
			});
		})
	}
}


app.get('/index', (req, res) => {
	
	res.render('index', {
	});
})


app.get('', (req, res) => {
	res.render('Login', {

	});
})


app.get('/Login', (req, res) => {
	res.render('Login', {
	});
})


app.post('/Login', (req,res) => {

	Usuario.findOne({documento : req.body.id}).exec((err,result) => {
		if(err){
			return res.render('Login', {
				inscrito : "El id ingresado no existe, registrese en el sistema primero"
			});
		}
		req.session.admin = (result.rol == 'Coordinador');
		req.session.usuario = result.documento;
		req.session.nombre = result.nombre;
		
		return ObtenerCursos(req.session.admin, res, req);

	})

})

app.post('/Registro', (req,res) => {

	let usuario = new Usuario ({
		documento: req.body.id,
		nombre: req.body.nombre,
		telefono: req.body.telefono,
		correo: req.body.email
	})

	usuario.save((err, result) => {
		if(err){
			return res.render('Registro', {
				duplicado: err
			});
		}

		res.render('Login', {
			inscrito: "El estudiante " + result.nombre + " quedo inscrito, por favor inicie sesión"
		});

	})
})

app.get('/Registro', (req, res) => {
	
	res.render('Registro', {
			
		});
})


app.get('/VerCursos', (req,res) => {

	return ObtenerCursos(req.session.admin, res, req);
})

app.get('/CursoCreado', (req,res) => {
	
	res.render('CrearCurso', {
	});
})

app.post('/CursoCreado', (req,res) => {

	let curso = new Curso ({
		identificador: parseInt(req.body.id),
		nombre: req.body.nombre,
		modalidad : req.body.modalidad,
		valor: parseInt(req.body.valor),
		intensidad : req.body.intensidad,
		descripcion : req.body.descripcion,
	})

	curso.save((err, result) => {

		if(err){
			return res.render('CrearCurso', {
				duplicado: err
			});
		}

		return ObtenerCursos(req.session.admin, res, req, "El curso " + result.nombre + " fue creado correctamente");

	})
})

app.post('/ActualizarEstado', (req,res) => {

	Curso.findOneAndUpdate({identificador : req.body.curso}, {estado : 'Cerrado'}, {new : true}, (err, result) => {

		if(err){
			return res.render('VerCursos', {
				CursoCreado: err
			});
		}

		ObtenerCursos(req.session.admin, res, req, "El curso " + result.nombre + " se cerro");
	})
})


app.get('/Inscripcion', (req,res) => {
	
	Usuario.findOne({documento : req.session.usuario}, (err,resultEstudiante) => {
		if(err){
			return res.render('Inscripcion', {
				error: err
			});
		}
		
		Curso.find({estado : 'Disponible'}).exec((err,result) => {
			if(err){
				return res.render('Inscripcion', {
					error: err
				});
			}

			res.render('Inscripcion', {
				nombre: resultEstudiante.nombre, 
				id: resultEstudiante.documento,
				telefono: resultEstudiante.telefono,
				email: resultEstudiante.correo,
				activos: result
			});
		}) 	
	})
	

})

app.post('/EstudianteInscrito', (req,res) => {

	let inscrito = new Inscrito ({
		estudiante : req.session.usuario,
		curso : parseInt(req.body.curso)
	})

	Inscrito.find({estudiante:req.session.usuario, curso:req.body.curso}, (err,result) =>{
		if(err){
			return res.render('ListarCursosInscrito', {
				msg: err
			});
		}

		if(result.length == 0){
			inscrito.save((err, resultInscrito) => {
				if(err){
					return res.render('ListarCursosInscrito', {
						msg: err
					});
				}

				Inscrito.find({estudiante : req.session.usuario}, (err,resultInscritos) =>{
					if(err){
						return res.render('ListarCursosInscrito', {
							msg: err
						});
					}



					Curso.find({estado : 'Disponible'}, (err,resultCursos) => {
						if(err){
							return res.render('ListarCursosInscrito', {
								msg: err
							});
						}

						res.render('ListarCursosInscrito', {
							cursos : resultCursos,
							cursosInscrito : resultInscritos
						});
					})


				})


			})
		}
		else{
			Usuario.findOne({documento : req.session.usuario}, (err,resultEstudiante) => {
				if(err){
					return res.render('Inscripcion', {
						error: err
					});
				}

				Curso.find({estado : 'Disponible'}).exec((err,result) => {
					if(err){
						return res.render('Inscripcion', {
							error: err
						});
					}

					res.render('Inscripcion', {
						nombre: resultEstudiante.nombre, 
						id: resultEstudiante.documento,
						telefono: resultEstudiante.telefono,
						email: resultEstudiante.correo,
						activos: result,
						error: "Ya esta inscrito en el curso"
					});
				}) 	
			})
		}

	})
	/**/

})


app.get('/ListarCursosInscrito', (req, res) => {
	
	Inscrito.find({estudiante : req.session.usuario}, (err,resultInscritos) =>{
		if(err){
			return res.render('ListarCursosInscrito', {
				msg: err
			});
		}

		Curso.find({estado : 'Disponible'}, (err,resultCursos) => {
			if(err){
				return res.render('ListarCursosInscrito', {
					msg: err
				});
			}

			res.render('ListarCursosInscrito', {
				cursos : resultCursos,
				cursosInscrito : resultInscritos
			});
		})


	})
})

app.post('/EliminarInscrito', (req,res) => {

	Inscrito.findOneAndDelete({estudiante:req.session.usuario, curso:req.body.cursoId}, (err,result) => {
		if(err){
			return res.render('ListarCursosInscrito', {
				msg: err
			});
		}

		Inscrito.find({estudiante : req.session.usuario}, (err,resultInscritos) =>{
			if(err){
				return res.render('ListarCursosInscrito', {
					msg: err
				});
			}

			Curso.find({estado : 'Disponible'}, (err,resultCursos) => {
				if(err){
					return res.render('ListarCursosInscrito', {
						msg: err
					});
				}

				res.render('ListarCursosInscrito', {
					cursos : resultCursos,
					cursosInscrito : resultInscritos,
					msg: "eliminado correctamente del curso"
				});
			})


		})
	})
})



app.get('/VerInscritos', (req,res) => {

	Inscrito.find({}, (err,resultInscritos) =>{
		if(err){
			return res.render('ListarInscritos', {
				msg: err
			});
		}

		Curso.find({estado : 'Disponible'}, (err,resultCursos) => {
			if(err){
				return res.render('ListarInscritos', {
					msg: err
				});
			}

			Usuario.find({}, (err, resultUsuarios) => {
				if(err){

				}
				res.render('ListarInscritos', {
					cursos : resultCursos,
					usuarios : resultUsuarios,
					inscritos : resultInscritos,
				});
			})
		})


	})
})


app.post('/EliminarInscritoAdmin', (req, res) => {
	
	Inscrito.findOneAndDelete({estudiante:req.body.EstudianteId, curso:req.body.cursoId}, (err,result) => {
		if(err){
			return res.render('ListarInscritos', {
				msg: err
			});
		}

		Inscrito.find({}, (err,resultInscritos) =>{
			if(err){
				return res.render('ListarInscritos', {
					msg: err
				});
			}

			Curso.find({estado : 'Disponible'}, (err,resultCursos) => {
				if(err){
					return res.render('ListarInscritos', {
						msg: err
					});
				}

				Usuario.find({}, (err, resultUsuarios) => {
					if(err){

					}
					res.render('ListarInscritos', {
						cursos : resultCursos,
						usuarios : resultUsuarios,
						inscritos : resultInscritos,
						msg: "Eliminado correctamente"
					});
				})
			})


		})
	})

})



app.post('/Salir', (req,res) => {
	req.session.destroy((err) => {
		if(err) return console.log(err)
	})
	res.redirect('/');
})

app.get('/ListarUsuarios', (req, res) => {
	
	res.render('ListarUsuarios', {
		admin: estudiante.admin,
		id: req.body.id,
		nombre: req.body.nombre,
		telefono: req.body.telefono,
		email: req.body.email,
		rol: req.body.rol
	});
})

app.post('/ListarUsuarios', (req, res) => {
	var filename = path.resolve(directorioListadoEstudiantes);
	delete require.cache[filename];
	let listaEstudiantes = require('./listadoEstudiantes.json');
	let duplicado = listaEstudiantes.find(x => x.id ==  parseInt(req.body.id));
	console.log(parseInt(req.body.id));
	res.render('ActualizarUsuario', {
		admin: estudiante.admin,
		id: req.body.id,
		nombre: duplicado.nombre,
		telefono: duplicado.telefono,
		email: duplicado.email,
		rol: duplicado.rol
	});
})


app.post('/ActualizarUsuario', (req,res) => {
	res.render('ListarUsuarios', {
		id: req.body.id,
		nombre: req.body.nombre,
		telefono: req.body.telefono,
		email: req.body.email,
		admin: estudiante.admin,
		rol: req.body.rol
	});
})





app.get('*', (req,res) => {
	res.render('index', {
	});
})


module.exports = app;
