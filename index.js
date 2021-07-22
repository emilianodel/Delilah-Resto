var express = require('express');
var server = express();
const parser = require('body-parser');
const Sequelize = require ('sequelize');
const path = `mysql://root@localhost:3306/delilah_resto`;
const myDataBase = new Sequelize(path);
server.use(parser.json());
server.use(express.json());

const jwt = require('jsonwebtoken');
const jwtPassword = "Ac4m1C4_D3lilah_Rest0!"

myDataBase.authenticate().then(() =>{ 
    console.log('Conectado')

}).catch(err => {
    console.error('Error de conexion' , err)
})

module.exports = myDataBase;



server.listen(3000, function () {
    console.log('Sistema armado en el puerto 3000')
});





/*--Endpoints de Users/Login y middelwares--*/

function validateUser(req, res, next) {
    const {username, full_name, email, phone_number, address, pass} = req.body;

    if (!username || !full_name || !email || !phone_number || !address || !pass){
        return res.status(400)
            .send({states: 'Error', message: 'Datos incompletos, es necesario completar todos los campos'})
    }

    return next();
}


const ifEmailExist = async (req, res, next) => {
    const {email} = req.body

    try {
        const ifUserExist = await myDataBase.query('SELECT * FROM users WHERE email =?', {
            replacements: [email],
            type: myDataBase.QueryTypes.SELECT
        })
        if(ifUserExist.length >= '1') {
            res.status(406).json({
                message: 'Usuario registrado'
            })

        } else {
            next();
        }
    }catch (err) {
        res.status(400).json ({
            message: 'Error'
        })
    }
}



server.post('/users', validateUser, ifEmailExist, async (req, res) => {

    const {username, full_name, email, phone_number, address, pass} = req.body;

    const users =  await myDataBase.query('INSERT INTO users (username, full_name, email, phone_number, address, pass) VALUES (?, ?, ?, ?, ?, ?)',
        {
        replacements: [username, full_name, email, phone_number, address, pass],
        type: myDataBase.QueryTypes.INSERT,
        }
    )
    
    users.push(req.body);
    res.status(201).json({status: "Usuario creado exitosamente"});
    console.log(users);
})



const verifyJWT = (req, res, next) => {

    try {
        let token = req.headers.authorization.split(" ")[1];
        let decodeToken = jwt.verify(token, jwtPassword);
        
        
        if(decodeToken) {
            req.token = decodeToken;
            return next();
        }

    }catch{
        res.status(401).send({error:"Usuario no autorizado"})
    }        
    
}



const verifyisAdmin =  (req, res, next) => {

    try {
        let token = req.headers.authorization;
        if(token) {
            token = token.split(" ")[1];
            let decode = jwt.verify(token, jwtPassword)
            console.log(decode)
    
            let isAdmin = decode.isAdmin
            
            if(isAdmin == 0) {
                res.status(401).send({error: "Usuario no autorizado"})
            } else {
                return next ();
            }
            
        } 
    } catch {
        res.status(401).json({message:"Usuario no autorizado"});
    }
}

server.post('/login', async (req, res) => {
    const {email, pass} = req.body

    try {
        const loginUser = await myDataBase.query('SELECT * FROM users WHERE email =? && pass =?', {
            replacements: [email, pass],
            type: myDataBase.QueryTypes.SELECT,
        })

    if (loginUser.length == 0){
        res.status(401).json({message: "Usuario o contrasena incorrecta"})
    } else{
        const infoUser = {
            users_id: loginUser[0].users_id,
            username: loginUser[0].username,
            full_name: loginUser[0].full_name,
            email: loginUser[0].email,
            phone_number: loginUser[0].phone_number,
            address: loginUser[0].address,
            isAdmin: loginUser[0].isAdmin
        }
        token = jwt.sign(infoUser, jwtPassword, {expiresIn: "2h"})
        console.log(token)
        res.status(200).json({message: "Login exitoso", "token": token})
        }
    } catch (err) {
        console.log(err)
    }
})



server.get('/users', verifyJWT, verifyisAdmin, async (req, res) => {
    try {
        const results = await myDataBase.query('SELECT * FROM users', {type: myDataBase.QueryTypes.SELECT});
        if(results){
            res.status(200).json(results);
            console.log(results);
        }else{
            throw new Error;
        }
    } catch (err) {
        res.status(400).json({
            message: `Error`
        })
    }
});


server.get('/users/:id', verifyJWT,verifyisAdmin, async(req, res) =>{
    const {id} = req.params;
    try {
        const idresults = await myDataBase.query('SELECT * FROM users WHERE users_id = ?', {
            type: myDataBase.QueryTypes.SELECT,
            replacements: [id]
        });
        //console.log(idresults)
        if(idresults.length == '0') {
            res.status(404).json({
                message: 'Usuario no existe'
            })
        }else if (idresults.length >= '1') {
            res.status(200).json(idresults)
        }else {
            throw new Error
        }
    } catch (err) {
        res.status(400).json ({
                message:`Error`
        });
    }  

});

/*--Endpoints de Users/Login y middelwares FIN--*/

/*--Endpoints de Productos y middelwares--*/



function validateProduct(req, res, next) {
    const {product_name, price} = req.body;

    if (!product_name || !price ){
        return res.status(400)
            .send({states: 'Error', message: 'Datos incompletos, es necesario completar todos los campos'})
    }

    return next();
}


const ifProductExist = async (req, res, next) => {
    const {products_id} = req.params;

    try {
        const ifProductExist = await myDataBase.query('SELECT * FROM products WHERE products_id =?', {
            replacements: [products_id],
            type: myDataBase.QueryTypes.SELECT
        })
        if(ifProductExist.length == 0) {
            res.status(404).json({
                message: 'El Producto no existe'
            })

        } else {
            next();
        }
        
    }catch (err) {
        res.status(400).json ({
            message: 'Error'
        })
    }
};



server.post('/products', validateProduct, verifyisAdmin, async (req, res) => {

    const {product_name, price} = req.body;

    const products =  await myDataBase.query('INSERT INTO products (product_name, price) VALUES (?, ?)',
        {
        replacements: [product_name, price],
        type: myDataBase.QueryTypes.INSERT,
        }
    )
    
    products.push(req.body);
    res.status(201).json({status: "Producto creado exitosamente"});
    console.log(products);
})

server.delete('/products/:products_id', verifyisAdmin, ifProductExist, async (req, res) => {

    const {products_id}= req.params;

    try{
        const products_id_delete =  await myDataBase.query('DELETE FROM products WHERE products_id = ?',
        {
        replacements: [products_id],
        })
       
        if(products_id_delete) {
            res.status(201).json({status: "Producto eliminado exitosamente"});
        } else {
            throw new Error
        }
    }catch(err) {
        res.status(400).json ({
            message: 'Error'
            })
    }   
 
})



server.put('/products/:products_id', verifyisAdmin, ifProductExist, validateProduct, async (req, res) => {

    const {product_name, price} = req.body;
    const product_id = req.params.products_id

    const products_update =  await myDataBase.query('UPDATE products SET product_name =?, price = ? WHERE products_id = ?',
        {
        replacements: [product_name, price, product_id],
        type: myDataBase.QueryTypes.UPDATE,
        }
    )
    
    products_update.push(req.body);
    res.status(201).json({status: "Producto actualizado exitosamente"});
    console.log(products_update);
})



server.get('/products', verifyJWT,async (req, res) => {
    try {
        const results = await myDataBase.query('SELECT * FROM products', { type: myDataBase.QueryTypes.SELECT });
        if(results){
            res.status(200).json(results);
            console.log(results);
        }else{
            throw new Error;
        }
    } catch (err) {
        res.status(400).json({
            message: `Error: ${err}`
        })
    }
});



server.get('/products/:products_id', verifyJWT, async(req, res) =>{
    const {products_id} = req.params;
    try {
        const idresults = await myDataBase.query('SELECT * FROM products WHERE products_id = ?', {
            type: myDataBase.QueryTypes.SELECT,
            replacements: [products_id]
        });
        console.log(idresults)
        if(idresults.length == '0') {
            res.status(404).json({
                message: 'Producto no existe'
            })
        }else if (idresults.length >= '1') {
            res.status(200).json(idresults)
        }else {
            throw new Error
        }
    } catch (err) {
        res.status(400).json ({
                message:`Error`
        });
    }  

});

/*--Endpoints de Productos FIN--*/


/*--Endpoints de Orders--*/

const ifOrderExist = async (req, res, next) =>{
    const {id} = req.params

    const orderExist = await myDataBase.query('SELECT * FROM orders WHERE order_id = ?', {
        type: myDataBase.QueryTypes.SELECT,
        replacements:[id]
    })
    if (orderExist.length == '0') {
        res.status(404).json({
            message: 'Este ID no corresponde a ninguna orden'
        })
    } else{
        next();
    }

}


server.post('/orders', verifyJWT, async (req, res) => {
    
    const {payment_id, items} = req.body;
    const infoUser = req.token.users_id
   
    try {

    const orders =  await myDataBase.query('INSERT INTO orders (users_id, payment_id) VALUES (?, ?)',
        {
            replacements: [infoUser, payment_id],
            type: myDataBase.QueryTypes.INSERT,
        })
        console.log(orders)

    const order_Id = orders[0]
    
    console.log(items)  


    items.forEach((items) => {
        myDataBase.query('INSERT INTO order_products (order_id,products_id,quantity) VALUES (?,?,?)', {
          replacements: [order_Id, items.products_id, items.quantity],
          type: myDataBase.QueryTypes.INSERT,
        });
      });


    const unit_price = await myDataBase.query('SELECT order_products.products_id, order_products.quantity, products.price, SUM(price*quantity) as total FROM order_products JOIN products ON order_products.products_id = products.products_id WHERE order_products.order_id = :order_Id', {
        type: myDataBase.QueryTypes.SELECT,
        replacements: {order_Id: order_Id}
    })
    
    const total = await myDataBase.query('UPDATE orders SET total = ? where order_id = ?', {
        replacements: [
            unit_price[0].total,
            order_Id,
        ]
    })
    console.log(unit_price[0].total)

    res.status(201).json({status:"Orden ID creada exitosamente"});
    } catch {
        res.status(400).json({
            message: 'Error'
        })
    }
    
})



server.get('/orders/:id', verifyJWT, verifyisAdmin, ifOrderExist, async(req, res) =>{
    const {id} = req.params
    try {
        
        const order_information = await myDataBase.query('SELECT status_order.status_name, orders.time, orders.order_id, order_products.quantity, products.product_name, orders.total, payment_method.payment_type, users.full_name, users.email, users.address, users.phone_number, order_products.order_id FROM orders INNER JOIN users ON orders.users_id = users.users_id INNER JOIN status_order ON orders.status_id = status_order.status_id INNER JOIN payment_method ON orders.payment_id = payment_method.payment_id INNER JOIN order_products ON orders.order_id = order_products.order_id INNER JOIN products ON order_products.products_id = products.products_id WHERE orders.order_id = ?', {
            type: myDataBase.QueryTypes.SELECT,
            replacements: [id]
        });
        const get_order_detail = await myDataBase.query(
            "SELECT order_products.order_id, order_products.quantity, products.price, products.product_name FROM order_products INNER JOIN products ON order_products.products_id = products.products_id WHERE order_products.order_id=?",
            {
              replacements: [id],
              type: myDataBase.QueryTypes.SELECT,
            }
          );
          orders_costumers = {
              order: order_information,
              order_details: get_order_detail,
          }
        if(orders_costumers) {
            res.status(200).json({
                orders_costumers
            })
        } else {
            res.status(404).json({
                message: 'El pedido no existe'
            })
        }
    } catch (err) {
        res.status(400).json ({
                message:`Error`
        });
    }  

});

server.delete('/orders/:id', verifyJWT, verifyisAdmin, ifOrderExist ,async(req, res) =>{ 
    const {id} = req.params

    try{
        const delete_order_products = await myDataBase.query('DELETE FROM order_products WHERE order_products.order_id = ?',{
            replacements: [id]
        })
        const delete_order = await myDataBase.query('DELETE FROM orders WHERE orders.order_id = ?',{
            replacements: [id]
        })

        if(delete_order_products && delete_order){
            res.status(200).json({
                message: 'Orden eliminada exitosamente'
            })
        }else{
            throw new Error;
        };

    } catch(err){
        res.status(400).json({
            message: 'Orden no existe'
        })

    }

})


server.put('/orders/:id', verifyJWT, verifyisAdmin, ifOrderExist ,async(req, res) =>{ 
    const id = req.params.id
    const {status_id} = req.body

   const status_update = await myDataBase.query('UPDATE orders SET status_id = ? WHERE orders.order_id = ?',{
    replacements:[status_id, id],
    type: myDataBase.query.UPDATE,
   }
   )
   status_update.push(req.body)
   res.status(201).json({status: 'El estatus del producto ha sido actualizado exitosamente'})

})

/*--Endpoints de Orden FIN--*/

/*--Middelware Global para captar errores--*/

server.use((err, req, res, next) => {
    if(!err) {
        return next();
    }
    console.log(JSON.stringify(err))

    res.status(500)
        .json({error:'Se ha producido un error inesperado.'})
})

