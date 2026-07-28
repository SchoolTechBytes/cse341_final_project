import swaggerAutogen from 'swagger-autogen';

const NODE_ENV = process.env.NODE_ENV?.toLocaleLowerCase() || 'production';

const doc = {
    info: {
        title: 'Ticket Support System API',
        description: 'This API is for CSE341 Final Project. REST API for a support ticketing system'
    },
    host: NODE_ENV === 'production' ? 'cse341-project-02-beyu.onrender.com' : 'localhost:3000',
    schemes: NODE_ENV === 'production' ? ['https'] : ['http']
};

const outputFile = './swagger.json';
const routes = ['./routes/routes.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen()(outputFile, routes, doc);