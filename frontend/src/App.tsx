import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./index.css";

//layout
import DashboardLayout from "./layouts/DashboardLayout";
import RequireAdmin from "./components/RequireAdmin";

//pages
import Home from "./pages/Home";
import Error from "./pages/Error";
import { ToastContainer } from "react-toastify";
import Menu from "./pages/Menu";
import Users from "./pages/Users";
import MenuNew from "./pages/MenuNew";
import MenuEdit from "./pages/MenuEdit";
import ManageItemTypes from "./pages/ManageItemTypes";
import SignIn from "./pages/SignIn";
import Reviews from "./pages/Reviews";
import Delivery from './pages/Delivery'
import DeliveryDetail from './pages/DeliveryDetail'
import DineIn from './pages/DineIn'
import DineInDetail from './pages/DineInDetail'
import Manage from './pages/Manage'
import ManageTables from './pages/ManageTables'
import ManageTablesNew from './pages/ManageTablesNew'
import ManageTablesEdit from './pages/ManageTablesEdit'
import ManageTimeSlots from './pages/ManageTimeSlots'
import ManageTimeSlotsNew from './pages/ManageTimeSlotsNew'
import ManageTimeSlotsEdit from './pages/ManageTimeSlotsEdit'
import Analytics from './pages/Analytics'
const App = () => {
   useEffect(() => {
      AOS.init();
   }, []);

   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<SignIn />} />

            <Route element={<RequireAdmin />}>
               <Route element={<DashboardLayout />}>
                  <Route path="/Home" element={<Home />} />
                  <Route path="/Menu" element={<Menu />} />
                  <Route path="/Menu/new" element={<MenuNew />} />
                  <Route path="/Menu/:id/edit" element={<MenuEdit />} />
                  <Route path="/Menu/Types" element={<ManageItemTypes />} />
                  <Route path="/Users" element={<Users />} />
                  <Route path="/Delivery" element={<Delivery />} />
                  <Route path="/Delivery/:id" element={<DeliveryDetail />} />
                  <Route path="/DineIn" element={<DineIn />} />
                  <Route path="/DineIn/:id" element={<DineInDetail />} />
                  <Route path="/Reviews" element={<Reviews />} />
                  <Route path="/Analytics" element={<Analytics />} />
                  <Route path="/Manage" element={<Manage />} />
                  <Route path="/Manage/Tables" element={<ManageTables />} />
                  <Route path="/Manage/Tables/new" element={<ManageTablesNew />} />
                  <Route path="/Manage/Tables/:id/edit" element={<ManageTablesEdit />} />
                  <Route path="/Manage/TimeSlots" element={<ManageTimeSlots />} />
                  <Route path="/Manage/TimeSlots/new" element={<ManageTimeSlotsNew />} />
                  <Route path="/Manage/TimeSlots/:id/edit" element={<ManageTimeSlotsEdit />} />
               </Route>
            </Route>

            <Route path="/*" element={<Error />} />

         </Routes>
         <ToastContainer position="top-right" theme="dark" />

      </BrowserRouter>
   );
};

export default App;
