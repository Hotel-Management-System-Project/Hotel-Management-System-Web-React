import { useEffect,useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AddRounded,DeleteOutlineRounded,EditRounded } from '@mui/icons-material';
import { Button,Card,Dialog,DialogActions,DialogContent,DialogTitle,FormControlLabel,IconButton,Switch,Table,TableBody,TableCell,TableHead,TableRow,TextField } from '@mui/material';
import { endpoints } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Empty,Loading,Notice,PageHeader,Status } from '../components/Common';

const empty={hotelId:'',roomNumber:'',roomType:'Deluxe',pricePerNight:'',capacity:2,availabilityStatus:true};
//search
const [search, setSearch] = useState('');

export default function Rooms(){
    const {isCustomer,isOwner}=useAuth();
    const [params]=useSearchParams(),hotelId=params.get('hotelId'),hotelName=params.get('hotelName');
    const [rows,setRows]=useState([]),
    [loading,setLoading]=useState(true),
    [notice,setNotice]=useState(null),
    [form,setForm]=useState(empty),
    [open,setOpen]=useState(false),
    [editId,setEditId]=useState(null);
    const load=()=>
        endpoints.rooms().then(x=>
            setRows(Array.isArray(x)?x:[])).catch(e=>
        setNotice({type:'error',message:e.message})).finally(()=>
            setLoading(false));useEffect(()=>
                {load()},[]);
    const edit=r=>
        {setForm(r||{...empty,hotelId:hotelId||''});setEditId(r?.roomId||null);setOpen(true)};
    const save=async()=>{
        const p={...form,hotelId:+form.hotelId,roomNumber:+form.roomNumber,pricePerNight:+form.pricePerNight,capacity:+form.capacity};try{editId?await endpoints.updateRoom(editId,p):await endpoints.addRoom(p);setOpen(false);load()}catch(e){setNotice({type:'error',message:e.message})}};
        const remove=async r=>{
            if(confirm(`Delete room #${r.roomNumber}?`)){
                await endpoints.deleteRoom(r.roomId);load()}};
                if(loading)return <Loading/>;
        let visible=hotelId?rows.filter(r=>Number(r.hotelId)===Number(hotelId)):rows;
        if(search.trim()) {
            visible = visible.filter(
                r=>
                    r.roomNumber.toString().includes(search)||
                r.roomType.toLowerCase().include(search.toLowerCase())
            );
        }
        if(isCustomer)visible=visible.filter(r=>r.availabilityStatus);const title=hotelName?`${hotelName} Rooms`:isCustomer?'Available Rooms':isOwner?'Select a Hotel':'Rooms';
        return <div className="page"><PageHeader eyebrow={hotelId?'Hotel workspace':isCustomer?'Find a room':'Inventory'} title={title} subtitle={hotelId?`Manage room inventory for ${hotelName||`hotel #${hotelId}`}.`:isOwner?'Open My Hotels and choose Manage Hotel to work hotel-wise.':isCustomer?'Browse available rooms.':'Manage room inventory.'} action={!isCustomer&&hotelId?
        <Button variant="contained" startIcon={<AddRounded/>} onClick={()=>edit()}>Add room</Button>:null}/>
        <Card className="table-wrap">
            //textfield
            <TextField
            fullWidth
            label="Search by Room Number or Type"
            value={search}
            onChange={(e) => 
                setSearch(e.target.value)}/>
                
            {!visible.length?
            <Empty title={isOwner&&!hotelId?'Select a hotel first':'No rooms found'}/>:
       <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Images</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>{!isCustomer&&
                    <TableCell/>}</TableRow></TableHead>
                    <TableBody>{visible.map(r=>
                        <TableRow key={r.roomId}>
                            <TableCell>#{r.roomNumber}</TableCell>
                                <TableCell>{r.roomType}</TableCell>
                                    <TableCell>₹{Number(r.pricePerNight).toLocaleString('en-IN')}</TableCell>
                                    <TableCell>{r.capacity}</TableCell>
                                    <TableCell>
                                        <Status value={r.availabilityStatus?'AVAILABLE':'UNAVAILABLE'}/></TableCell>{!isCustomer&&
                                        <TableCell>
                                            <IconButton onClick={()=>edit(r)}>
                                                <EditRounded/>
                                                </IconButton>
                                                <IconButton color="error" onClick={()=>remove(r)}>
                                                    <DeleteOutlineRounded/>
                                                    </IconButton>
                                                    </TableCell>}
                                                    </TableRow>)}
                                                    </TableBody>
                                                    </Table>}
                                                    </Card>
                                                    <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm">
                                                        <DialogTitle>{editId?'Edit room':`Add room to ${hotelName||'hotel'}`}</DialogTitle>
                                                        <DialogContent sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,pt:'10px!important'}}>{['hotelId','roomNumber','roomType','pricePerNight','capacity'].map(k=>
                                                            <TextField key={k} disabled={k==='hotelId'&&!!hotelId} label={k.replace(/([A-Z])/g,' $1')} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}
                                                            <FormControlLabel control={<Switch checked={form.availabilityStatus} onChange={e=>setForm({...form,availabilityStatus:e.target.checked})}/>} label="Available"/></DialogContent>
                                                            <DialogActions>
                                                                <Button onClick={()=>setOpen(false)}>Cancel</Button>
                                                                <Button variant="contained" onClick={save}>Save</Button></DialogActions>
                                                                </Dialog>
                                                                <Notice notice={notice} onClose={()=>setNotice(null)}/>
                                                                </div>}
