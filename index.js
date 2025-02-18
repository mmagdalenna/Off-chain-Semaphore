let {Identity}=require('@semaphore-protocol/identity');
let {Group}=require('@semaphore-protocol/group');
let {generateProof}=require('@semaphore-protocol/proof');
let {verifyProof}=require('@semaphore-protocol/proof');
const fsPromises=require('fs/promises');
const { exit } = require('process');

const commitmentsFilePath='./companyCommitments.txt';
// localy saved list of nullifiers required from verified proofs
const nullifiersPath='./validNullifiers.txt';

async function readFile(path){
    let data=await fsPromises.readFile(path,{encoding:'utf-8'});
    return data;
}

async function writeFile(path,data){
    let word=data+'\n';
    await fsPromises.appendFile(path,word,{encoding:'utf-8'});
}

async function main(){
    let data=await readFile(commitmentsFilePath);
    //console.log(data);
    let commitments=data.split('\n');
    commitments=commitments.map((elem)=>BigInt(elem));
    //console.log(commitments); 
    
    const group=new Group(commitments);

    let privateKey=6384;    // ovo ce biti vrednost koju je uneo korisnik
    //let privateKey=2;
    let userIdentity=new Identity(privateKey.toString());
    let userCommitment=userIdentity.commitment;

    if(group.indexOf(userCommitment)!=-1){
        console.log('User is a member of the group and can potentially leave a review!');
        // generisanje dokaza sledi
        const scope=group.root;
        const message='Let us pray this works.';

        // generating the proof
        const proof=await generateProof(userIdentity,group,message,scope);
        let nullifier=proof.nullifier;
        //console.log(nullifier,typeof nullifier); nullifier je string
        console.log('Nullifier je '+nullifier);

        let nullifiers=await readFile(nullifiersPath);
        nullifiers=nullifiers.split('\n');
        console.log('List of valid nullifiers:',nullifiers);        
        
        // proveravamo da li je korisnik vec ostavio recenziju ->
        // ako jeste onda je njegov nullifier zapamcen u validNullifiers.txt
        if(nullifiers.includes(nullifier)){
            console.log('User already left a revies! SPAM IS FORBBIDEN!')
        }else{
            // verifying th proof
            let ret=await verifyProof(proof);
            console.log(ret);

            if(ret){
                // proof is valid
                console.log('Writing to a file...');

                await writeFile(nullifiersPath,nullifier)
                    .then(()=> console.log('Nullifier is recorded'))
                    .catch((err)=>console.error(err));

                    console.log('Writing is finished.');
            } else {
                // proof is not valid
                console.log('Proof is not valid!')
            }
            
        }
        
    }else{
        console.log('User CANNOT leave a review.');
    }
}

main().then(()=>exit(0))
    .catch(()=> exit(1));
