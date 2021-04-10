let chai = require('chai');
let chaiHttp = require('chai-http');
const { request } = require('express');
let expect = chai.expect;
chai.use(chaiHttp);

describe('Testing /signupform Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/signupform')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});

describe('Testing /pwdchange Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/pwdchange')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});



// describe('Testing /otp Post method', () => {
//     it('Has returned 200 OK', function(done){
//         chai
//             .request('http://localhost:5050')
//             .post('/otp')
//             .then(function(res){
//                 expect(res).to.have.status(200);
//                 done();
//             })
//             .catch(function(err){
//                 throw(err);
//             });
//     },30000);
// });

// describe('Testing /fpw Post method', () => {
//     it('Has returned 200 OK', function(done){
//         chai
//             .request('http://localhost:5050')
//             .post('/fpw')
//             .then(function(res){
//                 expect(res).to.have.status(200);
//                 done();
//             })
//             .catch(function(err){
//                 throw(err);
//             });
//     },30000);
// });




// describe('Testing my Post method', () => {
//     it('should be return status 200 for /', function(done){
//         chai
//             .request('http://localhost:5050')
//             .post('/login_student')
//             .then(function(res){
//                 expect(res).to.have.status(200);
//                 done();
//             })
//             .catch(function(err){
//                 throw(err);
//             });
//     },30000);
// });


// describe('Testing my Post method', () => {
//     it('should be return status 200 for /', function(done){
//         chai
//             .request('http://localhost:5050')
//             .post('/login_student')
//             .then(function(res){
//                 expect(res).to.have.status(200);
//                 done();
//             })
//             .catch(function(err){
//                 throw(err);
//             });
//     },30000);
// });



// describe('Testing my Divisions', () => {
//     it('should be division ', function(done){
//         chai
//             .request('http://localhost:5050')
//             .post('/login_student')
//             .then(function(res){
//                 expect(res).to.have.status(200);
//                 done();
//             })
//             .catch(function(err){
//                 throw(err);
//             });
//     },30000);

// });

