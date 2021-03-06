const fs=require('fs');
const path=require('path');

const PDFDocument=require('pdfkit')


const Product = require('../models/product');
const Order = require('../models/order');


const ITEM_PER_PAGE=2;

exports.getProducts = (req, res, next) => {
  const page=+req.query.page||1;
  var totalItem=0;

  Product.find()
  .countDocuments()
  .then(numProducts=>{
    totalItem=numProducts;
    return Product.find()
    .skip((page-1)*ITEM_PER_PAGE)
    .limit(ITEM_PER_PAGE)
  })
  .then(products => {
        res.render('shop/product-list', {
          prods: products,
          pageTitle: 'Products',
          path: '/products',
          isAuthenticated: req.session.isLoggedIn,
          totalProducts:totalItem,
          currentPage:page,
          hasNextPage:ITEM_PER_PAGE*page<totalItem,
          hasPreviousPage:page>1,
          nextPage:page+1,
          previousPage:page-1,
          lastPage:Math.ceil(totalItem/ITEM_PER_PAGE)
        });
      })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page=+req.query.page||1;
  var totalItem=0;

  Product.find()
  .countDocuments()
  .then(numProducts=>{
    totalItem=numProducts;
    return Product.find()
    .skip((page-1)*ITEM_PER_PAGE)
    .limit(ITEM_PER_PAGE)
  })
  .then(products => {
        res.render('shop/index', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          isAuthenticated: req.session.isLoggedIn,
          totalProducts:totalItem,
          currentPage:page,
          hasNextPage:ITEM_PER_PAGE*page<totalItem,
          hasPreviousPage:page>1,
          nextPage:page+1,
          previousPage:page-1,
          lastPage:Math.ceil(totalItem/ITEM_PER_PAGE)
        });
      })
      .catch(err => {
        console.log(err);
      });

  // Product.find()
  // .skip((page-1)*ITEM_PER_PAGE)
  // .limit(ITEM_PER_PAGE)
  //   .then(products => {
  //     res.render('shop/index', {
  //       prods: products,
  //       pageTitle: 'Shop',
  //       path: '/',
  //       isAuthenticated: req.session.isLoggedIn
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  //console.log(req.seesion);
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};


exports.getInvoice=(req,res,next)=>{
  const orderId=req.params.orderId;
  const invoiceName='invoice-'+orderId+'.pdf';
  const invoicePath=path.join('data','invoices',invoiceName);
  Order.findById(orderId).then(order=>{
    if(!order)
    return next(new Error('No order found'));
    if(order.user.userId.toString()!==req.user._id.toString())
    return next(new Error('Not authoriszed'));

    const pdfDoc=new PDFDocument();

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline; filename="'+invoiceName+'"');

    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Hello World',{
      underline:true
    });
    pdfDoc.text('--------------------------');
    let totalPrice=0;
    order.products.forEach(prod=>{
      totalPrice+=prod.quantity*prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title+' - '+prod.quantity+' x $'+prod.product.price);
    })
    pdfDoc.text('--------------------------');
    pdfDoc.fontSize(20).text(totalPrice);
    pdfDoc.end();
  }).catch(err=>next(err));
}