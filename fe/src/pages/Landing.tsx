import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Users, Shield, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const features = [
	{
		icon: Sparkles,
		title: 'AI Matching',
		description: 'Thuật toán thông minh tìm bạn ở ghép phù hợp nhất',
	},
	{
		icon: Shield,
		title: 'Chính chủ xác thực',
		description: 'Thông tin phòng trọ được xác minh, tránh lừa đảo',
	},
	{
		icon: TrendingDown,
		title: 'Theo dõi giá',
		description: 'Cập nhật xu hướng giá phòng theo thời gian thực',
	},
];

const fadeUp = {
	hidden: { opacity: 0, y: 30 },
	visible: { opacity: 1, y: 0 },
};

export default function Landing() {
	const navigate = useNavigate();
	const [roleModalOpen, setRoleModalOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<'tenant' | 'landlord'>('tenant');
	const [modalMode, setModalMode] = useState<'login' | 'register'>('login');

	const openRoleModal = (mode: 'login' | 'register') => {
		setModalMode(mode);
		setRoleModalOpen(true);
	};
	
	const continueWithRole = () => {
		setRoleModalOpen(false);
		if (modalMode === 'login') {
			navigate(`/auth/login?role=${selectedRole}`);
		} else {
			navigate(`/auth/register?role=${selectedRole}`);
		}
		console.log(`Selected role: ${selectedRole}, Mode: ${modalMode}`);
	};
	console.log('Landing page rendered');
	return (
		<div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #00AA44 0%, #00AA44 100%)' }}>
			{/* Floating Shapes */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<motion.div
					className="absolute top-20 right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl"
					animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
					transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
				/>
				<motion.div
					className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-white/5 blur-3xl"
					animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
					transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
				/>
			</div>

			{/* Header */}
			<header className="relative z-10 container py-6">
				<nav className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg">
							<span className="text-[#00AA44] font-bold">KK</span>
						</div>
						<span className="font-bold text-2xl text-white">KnockKnock</span>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="ghost" className="hidden sm:inline-flex text-white hover:bg-white/20" onClick={() => openRoleModal('login')}>
							Đăng nhập
						</Button>
						<Button className="rounded-full shadow-lg bg-white text-[#00AA44] hover:bg-gray-100" onClick={() => openRoleModal('register')}>
							Đăng ký
						</Button>
					</div>
				</nav>
			</header>

			{/* Hero Section */}
			<section className="relative z-10 container pt-12 md:pt-24 pb-20">
				<motion.div
					className="max-w-3xl mx-auto text-center"
					initial="hidden"
					animate="visible"
					variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
				>
					<motion.div
						variants={fadeUp}
						transition={{ duration: 0.5 }}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/40 mb-6"
					>
						<Users className="h-4 w-4 text-white" />
						<span className="text-sm font-medium text-white">5,000+ sinh viên đang sử dụng</span>
					</motion.div>

					<motion.h1
						variants={fadeUp}
						transition={{ duration: 0.5 }}
						className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white"
					>
						Tìm trọ chưa bao giờ{' '}
						<span className="text-[#FACF48]">"chill"</span>
						{' '}đến thế
					</motion.h1>

					<motion.p
						variants={fadeUp}
						transition={{ duration: 0.5 }}
						className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto"
					>
						Kết nối với hàng nghìn sinh viên tại Hoà Lạc. 
						Tìm phòng trọ ưng ý, bạn ở ghép hợp tính cách chỉ trong vài bước.
					</motion.p>

					<motion.div
						variants={fadeUp}
						transition={{ duration: 0.5 }}
						className="flex flex-col sm:flex-row items-center justify-center gap-4"
					>
						<Button
							size="lg"
							asChild
							className="w-full sm:w-auto rounded-full text-lg px-8 shadow-lg bg-white text-[#00AA44] hover:bg-gray-100"
						>
							<Link to="/home">
								Khám phá ngay
								<ArrowRight className="ml-2 h-5 w-5" />
							</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							asChild
							className="w-full sm:w-auto rounded-full text-lg px-8 bg-transparent border-2 border-white text-white hover:bg-white/10"
						>
							<Link to="/auth/login?role=landlord">Đăng tin cho thuê</Link>
						</Button>
					</motion.div>
				</motion.div>

				{/* Trust Signals */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.5 }}
					className="mt-16 text-center"
				>
					<p className="text-sm text-white/80 mb-4">Được tin dùng bởi sinh viên từ</p>
					<div className="flex flex-wrap items-center justify-center gap-8">
						<div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-lg">
							<div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
								<span className="text-orange-500 font-bold text-xs">FPT</span>
							</div>
							<span className="font-medium text-gray-900">FPT University</span>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-lg">
							<div className="h-8 w-8 rounded-full bg-[#00AA44]/20 flex items-center justify-center">
								<span className="text-[#00AA44] font-bold text-xs">VNU</span>
							</div>
							<span className="font-medium text-gray-900">ĐHQG Hà Nội</span>
						</div>
					</div>
				</motion.div>
			</section>

			{/* Features */}
			<section className="relative z-10 container py-20">
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="grid md:grid-cols-3 gap-6"
				>
					{features.map((feature, index) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: index * 0.1, duration: 0.5 }}
							className="bg-white rounded-3xl p-8 hover:shadow-lg transition-shadow"
						>
							<div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00AA44] to-[#008833] flex items-center justify-center mb-6 shadow-md">
								<feature.icon className="h-7 w-7 text-white" />
							</div>
							<h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
							<p className="text-gray-600">{feature.description}</p>
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* CTA Section */}
			<section className="relative z-10 container py-20">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-lg"
				>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
						Sẵn sàng tìm bạn ở ghép?
					</h2>
					<p className="text-gray-600 mb-8 max-w-xl mx-auto">
						Chỉ mất 3 phút để hoàn thành bài test tính cách và tìm người bạn ở ghép lý tưởng.
					</p>
					<Button
						size="lg"
						asChild
						className="rounded-full text-lg px-8 shadow-lg bg-[#00AA44] text-white hover:bg-[#008833]"
					>
						<Link to="/quiz">
							Làm bài test ngay
							<Sparkles className="ml-2 h-5 w-5" />
						</Link>
					</Button>
				</motion.div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 container py-8 border-t border-white/20">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
							<span className="text-[#00AA44] font-bold text-sm">KK</span>
						</div>
						<span className="font-bold text-white">KnockKnock</span>
					</div>
					<p className="text-sm text-white/80">
						© 2026 KnockKnock. Phát triển bởi sinh viên, cho sinh viên.
					</p>
				</div>
			</footer>

			{/* Role Selection Modal */}
			{roleModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setRoleModalOpen(false)} />
					<div className="relative z-10 w-full max-w-md p-6 bg-card rounded-2xl shadow-xl">
						<h3 className="text-lg font-bold mb-4">
							{modalMode === 'register' ? 'Chọn vai trò để đăng ký' : 'Chọn vai trò để đăng nhập'}
						</h3>

						{/* Role options */}
						<div className="grid grid-cols-1 gap-3 mb-6">
							{modalMode === 'login' && (
								<label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${selectedRole === 'admin' ? 'border-primary bg-primary/5' : 'border-border'}`}>
									<input type="radio" name="role" value="admin" checked={selectedRole === 'admin'} onChange={() => setSelectedRole('admin')} className="hidden" />
									<Shield className="h-6 w-6 text-rose-500" />
									<div>
										<div className="font-medium">Admin</div>
										<div className="text-sm text-muted-foreground">Quản lý hệ thống</div>
									</div>
								</label>
							)}
							<label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${selectedRole === 'tenant' ? 'border-primary bg-primary/5' : 'border-border'}`}>
								<input type="radio" name="role" value="tenant" checked={selectedRole === 'tenant'} onChange={() => setSelectedRole('tenant')} className="hidden" />
								<Users className="h-6 w-6 text-primary" />
								<div>
									<div className="font-medium">Người tìm trọ</div>
									<div className="text-sm text-muted-foreground">Tìm phòng, làm bài quiz, kết nối bạn ở ghép</div>
								</div>
							</label>

							<label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${selectedRole === 'landlord' ? 'border-primary bg-primary/5' : 'border-border'}`}>
								<input type="radio" name="role" value="landlord" checked={selectedRole === 'landlord'} onChange={() => setSelectedRole('landlord')} className="hidden" />
								<Shield className="h-6 w-6 text-emerald-500" />
								<div>
									<div className="font-medium">Chủ trọ</div>
									<div className="text-sm text-muted-foreground">Đăng tin, quản lý ví và tin đăng</div>
								</div>
							</label>

						</div>

						<div className="flex items-center justify-end gap-3">
							<Button variant="ghost" onClick={() => setRoleModalOpen(false)}>Huỷ</Button>
							<Button onClick={continueWithRole}>Tiếp tục</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


