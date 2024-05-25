function test(count,batch){
    let total = 0;
    for (let i = 0; i < count/batch; i++) {
        let countBatch = (i+1) * batch;
        if(countBatch > count){
            countBatch = count - (batch*i) 
        }else{
            countBatch = batch
        }
        console.log(`generando ${countBatch}`)
        total += countBatch;
    }
    return total;
}

console.log(`Total:  ${test(5,10)}`)