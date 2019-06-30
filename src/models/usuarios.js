const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const usuarioSchema = new Schema({
	documento : {
		type : Number, 
		require : true,
		unique: true 
	},
	nombre : {
		type : String, 
		require : true,
		trim : true
	}, 
	correo : {
		type : String, 
		require : true,
		trim : true
	},
	telefono : {
		type : Number, 
		require : true
	}, 
	rol : {
		type : String,
		default : 'Aspirante'
	}
})

usuarioSchema.plugin(uniqueValidator, { message: 'Ya existe un usuario con el documento ingresado.' });

const Usuario = mongoose.model('Usuario', usuarioSchema);

let admin = new Usuario ({
	documento: 123456789,
	nombre: 'Juan Riveros',
	telefono: 30578477774,
	correo: 'admin@admin.com',
	rol: 'Coordinador'
})

Usuario.findOne({documento : admin.documento}, (err,result) => {
	if(err){
		return console.log(err)
	}


	if(result == null){
		admin.save((err, result) => {
			if(err){
				return console.log(err)
			}

		})
	}

})

module.exports = Usuario;