import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Clock, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface StaffComment {
  id: string;
  staff_name: string;
  staff_email: string;
  message: string;
  timestamp: string;
}

export interface SupportRequest {
  id: string;
  name: string;
  company: string;
  phone: string;
  extension?: string;
  subject: string;
  description: string;
  email?: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  type: "support";
  comments?: StaffComment[];
}

interface SupportRequestRowProps {
  request: SupportRequest;
  getCustomerFriendlyStatus: (status: string) => string;
}

export function SupportRequestRow({ request, getCustomerFriendlyStatus }: SupportRequestRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasComments = !!request.comments && request.comments.length > 0;

  return (
    <>
      <tr
        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="p-4">
          <div className="flex items-center gap-2">
            <button
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              type="button"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <span className="font-medium text-[#333333]">{request.subject}</span>
            {hasComments && (
              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <MessageSquare size={12} />
                {request.comments?.length}
              </span>
            )}
          </div>
        </td>
        <td className="p-4 text-[#666666] text-sm max-w-xs truncate" title={request.description}>
          {request.description}
        </td>
        <td className="p-4 text-xs text-[#666666]">
          <div>{request.name}</div>
          <div className="text-[#999999]">
            {request.phone}
            {request.extension ? ` ext. ${request.extension}` : ""}
          </div>
        </td>
        <td className="p-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${
              request.status === "resolved" || request.status === "closed"
                ? "bg-gray-100 text-gray-700"
                : request.status === "in_progress"
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {getCustomerFriendlyStatus(request.status)}
          </span>
        </td>
        <td className="p-4 text-xs text-[#999999]">
          {new Date(request.created_at).toLocaleDateString()}
        </td>
      </tr>

      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={5} className="p-0 bg-emerald-50/50">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-6 border-t-2 border-emerald-200">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Full Description
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-emerald-200">
                      <p className="text-[#666666] leading-relaxed">{request.description}</p>
                    </div>
                  </div>

                  {hasComments ? (
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MessageSquare size={16} className="text-emerald-600" />
                        Staff Comments and Updates ({request.comments?.length})
                      </h4>
                      <div className="space-y-3">
                        {request.comments?.map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-4 rounded-lg border-l-4 border-emerald-500 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-emerald-100 p-2 rounded-full">
                                  <User size={16} className="text-emerald-700" />
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-900">{comment.staff_name}</p>
                                  <p className="text-xs text-emerald-600">{comment.staff_email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-[#999999]">
                                <Clock size={12} />
                                {new Date(comment.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <p className="text-[#666666] leading-relaxed pl-10">{comment.message}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-emerald-200 text-center">
                      <MessageSquare size={32} className="text-emerald-300 mx-auto mb-2" />
                      <p className="text-emerald-600 font-semibold">No staff comments yet</p>
                      <p className="text-emerald-500 text-sm mt-1">
                        Staff will add comments and updates here once they review your request.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
