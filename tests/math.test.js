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

describe('Testing / Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /coord_edit Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/coord_edit')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /stud_edit Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/stud_edit')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /faculty_edit Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/faculty_edit')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /coord_add Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/coord_add')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /coord_remove Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/coord_remove')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});


describe('Testing /coord_group Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/coord_group')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});

describe('Testing /logout Get function', () => {
    it('Has returned 200 OK', function(done){
        chai
            .request('http://localhost:5050')
            .get('/logout')
            .then(function(res){
                expect(res).to.have.status(200);
                done();
            })
            .catch(function(err){
                throw(err);
            });
    },30000);
});