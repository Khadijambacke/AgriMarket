const role = (...roles) => { 
  return (req, res, next) => { 
    if (!req.user) { 
      return res.status(401).json({ message: 'Non authentifié.' }); 
    } 
    
    // L'administrateur a accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) { 
      return res.status(403).json({ 
        message: `Accès interdit. Rôle requis : ${roles.join(' ou ')}.`, 
      }); 
    } 
    next(); 
  }; 
}; 
module.exports = role;