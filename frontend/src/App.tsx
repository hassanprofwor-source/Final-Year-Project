import React, { useEffect } from "react";
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
            <Route exact path="/" element={<SignIn />} />

            <Route element={<RequireAdmin />}>
               <Route element={<DashboardLayout />}>
                  <Route exact path="/Home" element={<Home />} />
                  <Route exact path="/Menu" element={<Menu />} />
                  <Route exact path="/Menu/new" element={<MenuNew />} />
                  <Route exact path="/Menu/:id/edit" element={<MenuEdit />} />
                  <Route exact path="/Menu/Types" element={<ManageItemTypes />} />
                  <Route exact path="/Users" element={<Users />} />
                  <Route exact path="/Delivery" element={<Delivery />} />
                  <Route exact path="/Delivery/:id" element={<DeliveryDetail />} />
                  <Route exact path="/DineIn" element={<DineIn />} />
                  <Route exact path="/DineIn/:id" element={<DineInDetail />} />
                  <Route exact path="/Reviews" element={<Reviews />} />
                  <Route exact path="/Analytics" element={<Analytics />} />
                  <Route exact path="/Manage" element={<Manage />} />
                  <Route exact path="/Manage/Tables" element={<ManageTables />} />
                  <Route exact path="/Manage/Tables/new" element={<ManageTablesNew />} />
                  <Route exact path="/Manage/Tables/:id/edit" element={<ManageTablesEdit />} />
                  <Route exact path="/Manage/TimeSlots" element={<ManageTimeSlots />} />
                  <Route exact path="/Manage/TimeSlots/new" element={<ManageTimeSlotsNew />} />
                  <Route exact path="/Manage/TimeSlots/:id/edit" element={<ManageTimeSlotsEdit />} />
               </Route>
            </Route>

            <Route exact path="/*" element={<Error />} />

         </Routes>
         <ToastContainer position="top-right" theme="dark" />

      </BrowserRouter>
   );
};

export default App;
