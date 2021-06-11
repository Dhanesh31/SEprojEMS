const request = require('supertest');

test('Positive case', async () => {    
	
    await request('http://localhost:5050')
    .post('/addelective')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        elective_id : '19EEE333',
        elective_name : 'High Voltage Engineering',
        elective_sem : '5',
        elective_dept : 'CSE',
        credits : 3,
        capacity : 50,
    })
    .expect(302)
})

test('Negative case', async () => {    
	
    await request('http://localhost:5050')
    .post('/addelective')
    .send({
        mailid : 'CB.EN.U4CSE18358@gmail.com',
        elective_id : '19EEE333',
        elective_name : 'High Voltage Engineering',
        elective_sem : '5',
        elective_dept : 'CSE',
        credits : 3,
        capacity : 50,
    })
    .expect(500)
})