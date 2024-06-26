const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
	if (token == null) 
		return res.sendStatus(401)
	jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
		if (err) return res.status(401).send({success: false, message:"Token Expired Please login again"});
		req.user = user
		next()
	})
}