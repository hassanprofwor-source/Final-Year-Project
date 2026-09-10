import React, { useState } from "react";

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSections, setModalSections] = useState([]);

  const openModal = (type) => {
    let title = "";
    let sections = [];

    switch (type) {
      case "Privacy Policy":
        title = "Privacy Policy";
        sections = [
          {
            heading: "1. Information We Collect",
            points: [
              "Personal Details: Name, email, phone number, and address provided during reservations or account setup.",
              "Booking & Order Information: Table reservations, menu selections, feedback, and order history.",
              "Usage Data: Device type and interaction logs for service improvement.",
              "Weather-based Suggestions: Weather data is only used locally on your device and not stored by us.",
            ],
          },
          {
            heading: "2. How We Use Your Information",
            points: [
              "To manage reservations and orders.",
              "To provide customer support and personalized menu suggestions.",
              "To improve services through feedback and usage analytics.",
              "To improve services through feedback and usage analytics.",
            ],
          },
          {
            heading: "3. Data Sharing & Storage",
            points: [
              "We do not sell your data.",
              "We may share limited data with third-party services (like payment processors or weather APIs) strictly to provide core app functionalities.",
            ],
          },
          {
            heading: "4. Security",
            points: ["We use secure technologies and practices to safeguard your information."],
          },
          {
            heading: "5. Your Rights",
            points: ["You can request access to or deletion of your data anytime by contacting us."],
          },
        ];
        break;

      case "Terms of Service":
        title = "Terms of Service";
        sections = [
          {
            heading: "1. Account Responsibilities",
            points: ["Users are responsible for maintaining the confidentiality of their login credentials and for all activity under their account."],
          },
          {
            heading: "2. Services Offered",
            points: ["Our services include table reservation, order placement, menu browsing, and a customer feedback system."],
          },
          {
            heading: "3. Admin Rights",
            points: ["Admins manage settings, menus, reservations, and monitor feedback to ensure optimal service quality."],
          },
          {
            heading: "4. Use Restrictions",
            points: ["You agree not to misuse our platform or interfere with system integrity or security."],
          },
          {
            heading: "5. Modifications",
            points: ["We may modify these Terms at any time. Continued use of the app implies acceptance of the updated Terms."],
          },
          {
            heading: "6. Termination",
            points: ["Accounts can be terminated for violating terms or misuse of services."],
          },
        ];
        break;

      case "Refund Policy":
        title = "Refund Policy";
        sections = [
          {
            heading: "1. Table Reservation Fee",
            points: [
              "A £10 reservation fee is required to reserve a table from the app.",
              "This amount is deducted from your final bill at the restaurant.",
              "The £10 reservation fee is non-refundable, including cancellations and no-shows.",
            ],
          },
          {
            heading: "2. Order Cancellation",
            points: [
              "If you cancel your order by your own choice before preparation begins, a full refund is provided.",
              "If cancellation occurs after order processing starts, refund eligibility will depend on the order stage.",
            ],
          },
          {
            heading: "3. Refund Timeline",
            points: ["Refunds (when applicable) will be processed within 5–7 business days to the original payment method."],
          },
        ];
        break;

      default:
        title = "Information";
        sections = [{ heading: "", points: ["Content not available."] }];
    }

    setModalTitle(title);
    setModalSections(sections);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle("");
    setModalSections([]);
  };

  return (
    <div className="relative py-8 overflow-hidden bg-black mt-auto">
      <div className="container relative z-10 px-4 mx-auto">
        <div className="flex flex-wrap items-center justify-center md:justify-center -m-8">
          <div className="w-auto p-8">
            <a href="#">
              <div className="inline-flex justify-content">
                <span className="ml-4 text-lg font-bold text-white">
                  Sky<span className="text-red">plate</span>
                </span>
                <img className="w-7 h-9 pb-2" src="/assets/Logo1.jpg" alt="Logo" />
              </div>
            </a>
          </div>
          <div className="w-auto p-8">
            <ul className="flex flex-wrap items-center justify-center -m-5">
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map((item) => (
                <li className="p-5" key={item}>
                  <button
                    className="font-medium text-white hover:text-gray-400 transition"
                    onClick={() => openModal(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-auto p-8">
          <div className="-m-1.5 flex flex-wrap">
                     <div className="w-auto p-1.5">
                        <a href="https://www.facebook.com/momin.butt.988373">
                        <div className="flex items-center justify-center w-8 h-8 border border-white rounded-full hover:border-gray-400">
                        <svg
                                 width="8"
                                 height="14"
                                 viewBox="0 0 8 14"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                 <path
                                    d="M5.55736 5.2L5.55736 3.88C5.55736 3.308 5.69631 3 6.66894 3H7.87315V0.800003L6.02052 0.800003C3.70473 0.800003 2.77841 2.252 2.77841 3.88V5.2H0.925781L0.925781 7.4H2.77841L2.77841 14H5.55736L5.55736 7.4H7.59526L7.87315 5.2H5.55736Z"
                                    fill="#ffffff"></path>
                              </svg>
                           </div>
                        </a>
                     </div>
                     <div className="w-auto p-1.5">
                        <a href="https://www.linkedin.com/in/momin-mukhtar/">
                        <div className="flex items-center justify-center w-8 h-8 border border-white rounded-full hover:border-gray-400">
                        <svg
                                 width="15"
                                 height="16"
                                 viewBox="0 0 45 46"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                 <path
                                    d="M20.9716667,33.5527338 L25.001,33.5527338 L25.001,27.1328007 C25.001,25.439485 25.3213333,23.7988354 27.4206667,23.7988354 C29.491,23.7988354 29.517,25.7351486 29.517,27.2404662 L29.517,33.5527338 L33.5506667,33.5527338 L33.5506667,26.4341413 C33.5506667,22.9381777 32.796,20.2505391 28.711,20.2505391 C26.7483333,20.2505391 25.432,21.3265278 24.8943333,22.3471839 L24.839,22.3471839 L24.839,20.5725357 L20.9716667,20.5725357 L20.9716667,33.5527338 Z M16.423,14.1202696 C15.1273333,14.1202696 14.0823333,15.1682587 14.0823333,16.4595785 C14.0823333,17.7508984 15.1273333,18.7992208 16.423,18.7992208 C17.7133333,18.7992208 18.761,17.7508984 18.761,16.4595785 C18.761,15.1682587 17.7133333,14.1202696 16.423,14.1202696 L16.423,14.1202696 Z M14.4026667,33.5527338 L18.4406667,33.5527338 L18.4406667,20.5725357 L14.4026667,20.5725357 L14.4026667,33.5527338 Z M9.76633333,40 C8.79033333,40 8,39.2090082 8,38.2336851 L8,9.76631493 C8,8.79065843 8.79033333,8 9.76633333,8 L38.234,8 C39.2093333,8 40,8.79065843 40,9.76631493 L40,38.2336851 C40,39.2090082 39.2093333,40 38.234,40 L9.76633333,40 Z"
                                     fill="#ffffff"></path>
                              </svg>
                           </div>
                        </a>
                     </div>
                     <div className="w-auto p-1.5">
                        <a href="https://www.instagram.com/_momin_001_/">
                        <div className="flex items-center justify-center w-8 h-8 border border-white rounded-full hover:border-gray-400">
                        <svg
                                 width="16"
                                 height="15"
                                 viewBox="0 0 16 15"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                 <path
                                    d="M8.00094 0.360001C6.09046 0.360001 5.85022 0.368801 5.09958 0.402241C4.34894 0.437441 3.83766 0.555361 3.38974 0.729601C2.9199 0.906321 2.49433 1.18353 2.14278 1.54184C1.78468 1.89357 1.50751 2.31909 1.33054 2.7888C1.1563 3.23584 1.0375 3.748 1.00318 4.496C0.969738 5.2484 0.960937 5.48776 0.960937 7.40088C0.960937 9.31224 0.969738 9.5516 1.00318 10.3022C1.03838 11.052 1.1563 11.5633 1.33054 12.0112C1.51094 12.4741 1.75118 12.8666 2.14278 13.2582C2.5335 13.6498 2.92598 13.8909 3.38886 14.0704C3.83766 14.2446 4.34806 14.3634 5.09782 14.3978C5.84934 14.4312 6.0887 14.44 8.00094 14.44C9.91318 14.44 10.1517 14.4312 10.9032 14.3978C11.6521 14.3626 12.1651 14.2446 12.613 14.0704C13.0826 13.8936 13.5078 13.6164 13.8591 13.2582C14.2507 12.8666 14.4909 12.4741 14.6713 12.0112C14.8447 11.5633 14.9635 11.052 14.9987 10.3022C15.0321 9.5516 15.0409 9.31224 15.0409 7.4C15.0409 5.48776 15.0321 5.2484 14.9987 4.49688C14.9635 3.748 14.8447 3.23584 14.6713 2.7888C14.4944 2.31908 14.2172 1.89356 13.8591 1.54184C13.5077 1.1834 13.0821 0.906169 12.6121 0.729601C12.1633 0.555361 11.6512 0.436561 10.9023 0.402241C10.1508 0.368801 9.9123 0.360001 7.99918 0.360001H8.00182H8.00094ZM7.36998 1.62896H8.00182C9.8815 1.62896 10.1041 1.63512 10.846 1.66944C11.5324 1.70024 11.9055 1.81552 12.1537 1.91144C12.4819 2.03904 12.7169 2.19216 12.9633 2.43856C13.2097 2.68496 13.3619 2.91904 13.4895 3.24816C13.5863 3.49544 13.7007 3.86856 13.7315 4.55496C13.7658 5.2968 13.7729 5.51944 13.7729 7.39824C13.7729 9.27704 13.7658 9.50056 13.7315 10.2424C13.7007 10.9288 13.5854 11.301 13.4895 11.5492C13.3766 11.8549 13.1965 12.1313 12.9624 12.3579C12.716 12.6043 12.4819 12.7566 12.1528 12.8842C11.9064 12.981 11.5333 13.0954 10.846 13.127C10.1041 13.1605 9.8815 13.1684 8.00182 13.1684C6.12214 13.1684 5.89862 13.1605 5.15678 13.127C4.47038 13.0954 4.09814 12.981 3.84998 12.8842C3.54418 12.7715 3.26753 12.5916 3.04038 12.3579C2.80608 12.1309 2.62565 11.8543 2.51238 11.5483C2.41646 11.301 2.30118 10.9279 2.27038 10.2415C2.23694 9.49968 2.2299 9.27704 2.2299 7.39648C2.2299 5.5168 2.23694 5.29504 2.27038 4.5532C2.30206 3.8668 2.41646 3.49368 2.51326 3.24552C2.64086 2.91728 2.79398 2.68232 3.04038 2.43592C3.28678 2.18952 3.52086 2.03728 3.84998 1.90968C4.09814 1.81288 4.47038 1.69848 5.15678 1.6668C5.80622 1.63688 6.0579 1.62808 7.36998 1.6272V1.62896ZM11.7594 2.7976C11.6485 2.7976 11.5386 2.81945 11.4361 2.86191C11.3336 2.90436 11.2405 2.96659 11.1621 3.04504C11.0836 3.12348 11.0214 3.21661 10.9789 3.31911C10.9365 3.42161 10.9146 3.53146 10.9146 3.6424C10.9146 3.75334 10.9365 3.8632 10.9789 3.96569C11.0214 4.06819 11.0836 4.16132 11.1621 4.23976C11.2405 4.31821 11.3336 4.38044 11.4361 4.42289C11.5386 4.46535 11.6485 4.4872 11.7594 4.4872C11.9835 4.4872 12.1984 4.3982 12.3568 4.23976C12.5152 4.08133 12.6042 3.86646 12.6042 3.6424C12.6042 3.41835 12.5152 3.20347 12.3568 3.04504C12.1984 2.88661 11.9835 2.7976 11.7594 2.7976ZM8.00182 3.78496C7.52228 3.77748 7.04604 3.86547 6.60084 4.0438C6.15563 4.22214 5.75035 4.48726 5.40859 4.82373C5.06683 5.1602 4.79542 5.5613 4.61016 6.00367C4.4249 6.44604 4.32949 6.92084 4.32949 7.40044C4.32949 7.88004 4.4249 8.35484 4.61016 8.79721C4.79542 9.23958 5.06683 9.64068 5.40859 9.97715C5.75035 10.3136 6.15563 10.5787 6.60084 10.7571C7.04604 10.9354 7.52228 11.0234 8.00182 11.0159C8.95093 11.0011 9.85616 10.6137 10.5221 9.93726C11.1881 9.26084 11.5613 8.34967 11.5613 7.40044C11.5613 6.45121 11.1881 5.54004 10.5221 4.86362C9.85616 4.1872 8.95093 3.79977 8.00182 3.78496ZM8.00182 5.05304C8.62427 5.05304 9.22123 5.30031 9.66137 5.74045C10.1015 6.18059 10.3488 6.77755 10.3488 7.4C10.3488 8.02245 10.1015 8.61941 9.66137 9.05955C9.22123 9.49969 8.62427 9.74696 8.00182 9.74696C7.37937 9.74696 6.78241 9.49969 6.34227 9.05955C5.90213 8.61941 5.65486 8.02245 5.65486 7.4C5.65486 6.77755 5.90213 6.18059 6.34227 5.74045C6.78241 5.30031 7.37937 5.05304 8.00182 5.05304Z"
                                    fill="#ffffff"></path>
                              </svg>
                           </div>
                        </a>
                     </div>
                  </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/8 bg-surface p-6 shadow-lg">
            <button
              onClick={closeModal}
              className="absolute right-4 top-3 text-2xl font-bold text-gray hover:text-white"
            >
              ×
            </button>
            <h2 className="mb-4 text-center text-xl font-semibold text-white">{modalTitle}</h2>

            {modalSections.map((section, index) => (
              <div key={index} className="mb-6">
                {section.heading && (
                  <h3 className="mb-2 text-md font-semibold text-white">{section.heading}</h3>
                )}
                <ul className="list-inside list-disc space-y-1 text-sm text-gray">
                  {section.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;
