module.exports=(req,res,next)=>{
    //console.log(req.body);
    if(!req.session.isLoggedIn)
    return res.redirect('/login');
    else
    return next()
}