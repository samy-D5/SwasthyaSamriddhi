import Sidebar from "@/app/components/doctorSidebar";

export default function DoctorLayout({ children }) {
    return (    
        <div className="flex "><Sidebar/>
        <div className="w-full h-full m-3">
            {children}
        </div>
       </div>
        );
  }