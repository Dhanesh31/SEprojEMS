const request = require('supertest');


//addelective
test('Positive case', async () => {    
	
    await request('http://localhost:5050')
    .post('/addelective')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        elective_id : '19EEE333',
        elective_name : 'High Voltage Engineering',
        elective_sem : '5',
        elective_dept : 'EEE',
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
        elective_dept : 'EEE',
        credits : 3,
        capacity : 50,
    })
    .expect(500)
})

//remelective
test('Positive case', async () => {    
	
    await request('http://localhost:5050')
    .post('/remelective')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        elective_name : 'High Voltage Engineering',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(302)
})

test('Negative case', async () => {    
	
    await request('http://localhost:5050')
    .post('/remelective')
    .send({
        mailid : 'CB.EN.U4CSE18358@gmail.com',
        elective_name : 'High Voltage Engineering',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(500)
})

// Coordinator Save
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/coord_save')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        name : 'Dhanesh Kumar',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        gender : 'Male',
        edit_profile : 0
    })
    .expect(302)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/coord_save')
    .send({
        mailid : 'CB.EN.U4CSE18313@gmail.com',
        name : 'Dhanesh Kumar A C',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        gender : 'Male',
        edit_profile : 0
    })
    .expect(500)
})

//groupelective
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/groupelective')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        sem : '6',
        dept : 'ECE'
    })
    .expect(200)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/groupelective')
    .send({
        mailid : 'CB.EN.U4CSE18337@gmail.com',
        sem : '6',
        dept : 'ECE'
    })
    .expect(500)
})


//faculty_setTime
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/faculty_setTime')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        day : '2021-6-11',
        hours : '20',
        mins : '15'
    })
    .expect(302)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/faculty_setTime')
    .send({
        mailid : 'CB.EN.U4CSE18337@gmail.com',
        day : '2021-6-11',
        hours : '20',
        mins : '15'
    })
    .expect(500)
})

//faculty_save
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/faculty_save')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        name : 'Dhanesh Kumar',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        mail : 'dhaneshkumarac@gmail.com',
        gender : 'Male',
        edit_profile : 0,
        dept : 'EEE'
    })
    .expect(302)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/faculty_save')
    .send({
        mailid : 'CB.EN.U4CSE18313@gmail.com',
        name : 'Dhanesh Kumar',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        mail : 'dhaneshkumarac@gmail.com',
        gender : 'Male',
        edit_profile : 0,
        dept : 'EEE'
    })
    .expect(500)
})


//filter_faculty
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/filter_faculty')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        filter_sem : 'ALL',
        filter_dept : 'ALL'
    })
    .expect(200)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/filter_faculty')
    .send({
        mailid : 'CB.EN.U4CSE18337@gmail.com',
        filter_sem : '6',
        filter_dept : 'ECE'
    })
    .expect(500)
})


//sendfaculties
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/sendfaculties')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        sem : '6',
        dept : 'ECE'
    })
    .expect(307)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/sendfaculties')
    .send({
        mailid : 'CB.EN.U4CSE18337@gmail.com',
        sem : '6',
        dept : 'ECE'
    })
    .expect(500)
})

//stud_save
test('Positive case', async () => {    

    await request('http://localhost:5050')
    .post('/stud_save')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        name : 'Dhanesh Kumar',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        gender : 'Male',
        edit_profile : 0,
        sem : 5,
        dept : 'EEE',
        rollno : 'CB.EN.U4CSE18313',
        preference_given : 0,
        feedback_given : 0
    })
    .expect(302)
})

test('Negative case', async () => {    

    await request('http://localhost:5050')
    .post('/stud_save')
    .send({
        mailid : 'CB.EN.U4CSE18313@gmail.com',
        name : 'Dhanesh Kumar',
        dob : '31/12/2000',
        mobile : 7358536599,
        k : 2,
        Age : 20,
        City:'Madurai',
        State:'Tamil Nadu',
        gender : 'Male',
        edit_profile : 0,
        sem : 5,
        dept : 'EEE',
        rollno : 'CB.EN.U4CSE18313',
        preference_given : 0,
        feedback_given : 0
    })
    .expect(500)
})

//coord_view_pref
test('Boundary case - Assign', async () => {

    await request('http://localhost:5050')
    .post('/coord_view_pref')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(200)
})

test('Negative case - Assign', async () => {

    await request('http://localhost:5050')
    .post('/coord_view_pref')
    .send({
        mailid : 'CB.EN.U4CSE18358@gmail.com',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(500)
})

test('Boundary case - Availability', async () => {

    await request('http://localhost:5050')
    .post('/coord_check_availability')
    .send({
        mailid : 'dhaneshkumarac@gmail.com',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(200)
})

test('Negative case - Availability', async () => {

    await request('http://localhost:5050')
    .post('/coord_check_availability')
    .send({
        mailid : 'CB.EN.U4CSE18358@gmail.com',
        elective_sem : '5',
        elective_dept : 'EEE'
    })
    .expect(500)
})