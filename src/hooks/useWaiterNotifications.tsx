import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Base64 encoded notification sound (different ding for waiters)
const NOTIFICATION_SOUND_BASE64 = "data:audio/wav;base64,UklGRl9XAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTtXAACA/4D/gP+A/4D/gP+A/3//f/9//3//f/9//3//fv9+/37/fv9+/37/fv99/33/ff99/33/ff99/3z/fP98/3z/fP98/3z/e/97/3v/e/97/3v/e/96/3r/ev96/3r/ev96/3n/ef95/3n/ef95/3n/eP94/3j/eP94/3j/eP93/3f/d/93/3f/d/93/3b/dv92/3b/dv92/3b/df91/3X/df91/3X/df90/3T/dP90/3T/dP90/3P/c/9z/3P/c/9z/3P/cv9y/3L/cv9y/3L/cv9x/3H/cf9x/3H/cf9x/3D/cP9w/3D/cP9w/3D/b/9v/2//b/9v/2//b/9u/27/bv9u/27/bv9u/23/bf9t/23/bf9t/23/bP9s/2z/bP9s/2z/bP9r/2v/a/9r/2v/a/9r/2r/av9q/2r/av9q/2r/af9p/2n/af9p/2n/af9o/2j/aP9o/2j/aP9o/2f/Z/9n/2f/Z/9n/2f/Zv9m/2b/Zv9m/2b/Zv9l/2X/Zf9l/2X/Zf9l/2T/ZP9k/2T/ZP9k/2T/Y/9j/2P/Y/9j/2P/Y/9i/2L/Yv9i/2L/Yv9i/2H/Yf9h/2H/Yf9h/2H/YP9g/2D/YP9g/2D/YP9f/1//X/9f/1//X/9f/17/Xv9e/17/Xv9e/17/Xf9d/13/Xf9d/13/Xf9c/1z/XP9c/1z/XP9c/1v/W/9b/1v/W/9b/1v/Wv9a/1r/Wv9a/1r/Wv9Z/1n/Wf9Z/1n/Wf9Z/1j/WP9Y/1j/WP9Y/1j/V/9X/1f/V/9X/1f/V/9W/1b/Vv9W/1b/Vv9W/1X/Vf9V/1X/Vf9V/1X/VP9U/1T/VP9U/1T/VP9T/1P/U/9T/1P/U/9T/1L/Uv9S/1L/Uv9S/1L/Uf9R/1H/Uf9R/1H/Uf9Q/1D/UP9Q/1D/UP9Q/0//T/9P/0//T/9P/0//Tv9O/07/Tv9O/07/Tv9N/03/Tf9N/03/Tf9N/0z/TP9M/0z/TP9M/0z/S/9L/0v/S/9L/0v/S/9K/0r/Sv9K/0r/Sv9K/0n/Sf9J/0n/Sf9J/0n/SP9I/0j/SP9I/0j/SP9H/0f/R/9H/0f/R/9H/0b/Rv9G/0b/Rv9G/0b/Rf9F/0X/Rf9F/0X/Rf9E/0T/RP9E/0T/RP9E/0P/Q/9D/0P/Q/9D/0P/Qv9C/0L/Qv9C/0L/Qv9B/0H/Qf9B/0H/Qf9B/0D/QP9A/0D/QP9A/0D/P/8//z//P/8//z//P/8+/z7/Pv8+/z7/Pv8+/z3/Pf89/z3/Pf89/z3/PP88/zz/PP88/zz/PP87/zv/O/87/zv/O/87/zr/Ov86/zr/Ov86/zr/Of85/zn/Of85/zn/Of84/zj/OP84/zj/OP84/zf/N/83/zf/N/83/zf/Nv82/zb/Nv82/zb/Nv81/zX/Nf81/zX/Nf81/zT/NP80/zT/NP80/zT/M/8z/zP/M/8z/zP/M/8y/zL/Mv8y/zL/Mv8y/zH/Mf8x/zH/Mf8x/zH/MP8w/zD/MP8w/zD/MP8v/y//L/8v/y//L/8v/y7/Lv8u/y7/Lv8u/y7/Lf8t/y3/Lf8t/y3/Lf8s/yz/LP8s/yz/LP8s/yv/K/8r/yv/K/8r/yv/Kv8q/yr/Kv8q/yr/Kv8p/yn/Kf8p/yn/Kf8p/yj/KP8o/yj/KP8o/yj/J/8n/yf/J/8n/yf/J/8m/yb/Jv8m/yb/Jv8m/yX/Jf8l/yX/Jf8l/yX/JP8k/yT/JP8k/yT/JP8j/yP/I/8j/yP/I/8j/yL/Iv8i/yL/Iv8i/yL/If8h/yH/If8h/yH/If8g/yD/IP8g/yD/IP8g/x//H/8f/x//H/8f/x//Hv8e/x7/Hv8e/x7/Hv8d/x3/Hf8d/x3/Hf8d/xz/HP8c/xz/HP8c/xz/G/8b/xv/G/8b/xv/G/8a/xr/Gv8a/xr/Gv8a/xn/Gf8Z/xn/Gf8Z/xn/GP8Y/xj/GP8Y/xj/GP8X/xf/F/8X/xf/F/8X/xb/Fv8W/xb/Fv8W/xb/Ff8V/xX/Ff8V/xX/Ff8U/xT/FP8U/xT/FP8U/xP/E/8T/xP/E/8T/xP/Ev8S/xL/Ev8S/xL/Ev8R/xH/Ef8R/xH/Ef8R/xD/EP8Q/xD/EP8Q/xD/D/8P/w//D/8P/w//D/8O/w7/Dv8O/w7/Dv8O/w3/Df8N/w3/Df8N/w3/DP8M/wz/DP8M/wz/DP8L/wv/C/8L/wv/C/8L/wr/Cv8K/wr/Cv8K/wr/Cf8J/wn/Cf8J/wn/Cf8I/wj/CP8I/wj/CP8I/wf/B/8H/wf/B/8H/wf/Bv8G/wb/Bv8G/wb/Bv8F/wX/Bf8F/wX/Bf8F/wT/BP8E/wT/BP8E/wT/A/8D/wP/A/8D/wP/A/8C/wL/Av8C/wL/Av8C/wH/Af8B/wH/Af8B/wH/AP8A/wD/AP8A/wD/AP///v/+//7//v/+//7//v/9//3//f/9//3//f/9//z//P/8//z//P/8//z/+//7//v/+//7//v/+//6//r/+v/6//r/+v/6//n/+f/5//n/+f/5//n/+P/4//j/+P/4//j/+P/3//f/9//3//f/9//3//b/9v/2//b/9v/2//b/9f/1//X/9f/1//X/9f/0//T/9P/0//T/9P/0//P/8//z//P/8//z//P/8v/y//L/8v/y//L/8v/x//H/8f/x//H/8f/x//D/8P/w//D/8P/w//D/7//v/+//7//v/+//7//u/+7/7v/u/+7/7v/u/+3/7f/t/+3/7f/t/+3/7P/s/+z/7P/s/+z/7P/r/+v/6//r/+v/6//r/+r/6v/q/+r/6v/q/+r/6f/p/+n/6f/p/+n/6f/o/+j/6P/o/+j/6P/o/+f/5//n/+f/5//n/+f/5v/m/+b/5v/m/+b/5v/l/+X/5f/l/+X/5f/l/+T/5P/k/+T/5P/k/+T/4//j/+P/4//j/+P/4//i/+L/4v/i/+L/4v/i/+H/4f/h/+H/4f/h/+H/4P/g/+D/4P/g/+D/4P/f/9//3//f/9//3//f/97/3v/e/97/3v/e/97/3f/d/93/3f/d/93/3f/c/9z/3P/c/9z/3P/c/9v/2//b/9v/2//b/9v/2v/a/9r/2v/a/9r/2v/Z/9n/2f/Z/9n/2f/Z/9j/2P/Y/9j/2P/Y/9j/1//X/9f/1//X/9f/1//W/9b/1v/W/9b/1v/W/9X/1f/V/9X/1f/V/9X/1P/U/9T/1P/U/9T/1P/T/9P/0//T/9P/0//T/9L/0v/S/9L/0v/S/9L/0f/R/9H/0f/R/9H/0f/Q/9D/0P/Q/9D/0P/Q/8//z//P/8//z//P/8//zv/O/87/zv/O/87/zv/N/83/zf/N/83/zf/N/8z/zP/M/8z/zP/M/8z/y//L/8v/y//L/8v/y//K/8r/yv/K/8r/yv/K/8n/yf/J/8n/yf/J/8n/yb/Jv8m/yb/Jv8m/yb/Jf8l/yX/Jf8l/yX/Jf8k/yT/JP8k/yT/JP8k/yP/I/8j/yP/I/8j/yP/Iv8i/yL/Iv8i/yL/Iv8h/yH/If8h/yH/If8h/yD/IP8g/yD/IP8g/yD/H/8f/x//H/8f/x//H/8e/x7/Hv8e/x7/Hv8e/x3/Hf8d/x3/Hf8d/x3/HP8c/xz/HP8c/xz/HP8b/xv/G/8b/xv/G/8b/xr/Gv8a/xr/Gv8a/xr/Gf8Z/xn/Gf8Z/xn/Gf8Y/xj/GP8Y/xj/GP8Y/xf/F/8X/xf/F/8X/xf/Fv8W/xb/Fv8W/xb/Fv8V/xX/Ff8V/xX/Ff8V/xT/FP8U/xT/FP8U/xT/E/8T/xP/E/8T/xP/E/8S/xL/Ev8S/xL/Ev8S/xH/Ef8R/xH/Ef8R/xH/EP8Q/xD/EP8Q/xD/EP8P/w//D/8P/w//D/8P/w7/Dv8O/w7/Dv8O/w7/Df8N/w3/Df8N/w3/Df8M/wz/DP8M/wz/DP8M/wv/C/8L/wv/C/8L/wv/Cv8K/wr/Cv8K/wr/Cv8J/wn/Cf8J/wn/Cf8J/wj/CP8I/wj/CP8I/wj/B/8H/wf/B/8H/wf/B/8G/wb/Bv8G/wb/Bv8G/wX/Bf8F/wX/Bf8F/wX/BP8E/wT/BP8E/wT/BP8D/wP/A/8D/wP/A/8D/wL/Av8C/wL/Av8C/wL/Af8B/wH/Af8B/wH/Af8A/wD/AP8A/wD/AP8A//7//v/+//7//v/+//7//f/9//3//f/9//3//f/8//z//P/8//z//P/8//v/+//7//v/+//7//v/+v/6//r/+v/6//r/+v/5//n/+f/5//n/+f/5//j/+P/4//j/+P/4//j/9//3//f/9//3//f/9//2//b/9v/2//b/9v/2//X/9f/1//X/9f/1//X/9P/0//T/9P/0//T/9P/z//P/8//z//P/8//z//L/8v/y//L/8v/y//L/8f/x//H/8f/x//H/8f/w//D/8P/w//D/8P/w/+//7//v/+//7//v/+//7v/u/+7/7v/u/+7/7v/t/+3/7f/t/+3/7f/t/+z/7P/s/+z/7P/s/+z/6//r/+v/6//r/+v/6//q/+r/6v/q/+r/6v/q/+n/6f/p/+n/6f/p/+n/6P/o/+j/6P/o/+j/6P/n/+f/5//n/+f/5//n/+b/5v/m/+b/5v/m/+b/5f/l/+X/5f/l/+X/5f/k/+T/5P/k/+T/5P/k/+P/4//j/+P/4//j/+P/4v/i/+L/4v/i/+L/4v/h/+H/4f/h/+H/4f/h/+D/4P/g/+D/4P/g/+D/3//f/9//3//f/9//3//e/97/3v/e/97/3v/e/93/3f/d/93/3f/d/93/3P/c/9z/3P/c/9z/3P/b/9v/2//b/9v/2//b/9r/2v/a/9r/2v/a/9r/2f/Z/9n/2f/Z/9n/2f/Y/9j/2P/Y/9j/2P/Y/9f/1//X/9f/1//X/9f/1v/W/9b/1v/W/9b/1v/V/9X/1f/V/9X/1f/V/9T/1P/U/9T/1P/U/9T/0//T/9P/0//T/9P/0//S/9L/0v/S/9L/0v/S/9H/0f/R/9H/0f/R/9H/0P/Q/9D/0P/Q/9D/0P/P/8//z//P/8//z//P/87/zv/O/87/zv/O/87/zf/N/83/zf/N/83/zf/M/8z/zP/M/8z/zP/M/8v/y//L/8v/y//L/8v/yv/K/8r/yv/K/8r/yv/J/8n/yf/J/8n/yf/J/8j/yP/I/8j/yP/I/8j/x//H/8f/x//H/8f/x//G/8b/xv/G/8b/xv/G/8X/xf/F/8X/xf/F/8X/xP/E/8T/xP/E/8T/xP/D/8P/w//D/8P/w//D/8L/wv/C/8L/wv/C/8L/wf/B/8H/wf/B/8H/wf/A/8D/wP/A/8D/wP/A/7//v/+//7//v/+//7//vv++/77/vv++/77/vv+9/73/vf+9/73/vf+9/7z/vP+8/7z/vP+8/7z/u/+7/7v/u/+7/7v/u/+6/7r/uv+6/7r/uv+6/7n/uf+5/7n/uf+5/7n/uP+4/7j/uP+4/7j/uP+3/7f/t/+3/7f/t/+3/7b/tv+2/7b/tv+2/7b/tf+1/7X/tf+1/7X/tf+0/7T/tP+0/7T/tP+0/7P/s/+z/7P/s/+z/7P/sv+y/7L/sv+y/7L/sv+x/7H/sf+x/7H/sf+x/7D/sP+w/7D/sP+w/7D/r/+v/6//r/+v/6//r/+u/67/rv+u/67/rv+u/63/rf+t/63/rf+t/63/rP+s/6z/rP+s/6z/rP+r/6v/q/+r/6v/q/+r/6r/qv+q/6r/qv+q/6r/qf+p/6n/qf+p/6n/qf+o/6j/qP+o/6j/qP+o/6f/p/+n/6f/p/+n/6f/pv+m/6b/pv+m/6b/pv+l/6X/pf+l/6X/pf+l/6T/pP+k/6T/pP+k/6T/o/+j/6P/o/+j/6P/o/+i/6L/ov+i/6L/ov+i/6H/of+h/6H/of+h/6H/oP+g/6D/oP+g/6D/oP+f/5//n/+f/5//n/+f/57/nv+e/57/nv+e/57/nf+d/53/nf+d/53/nf+c/5z/nP+c/5z/nP+c/5v/m/+b/5v/m/+b/5v/mv+a/5r/mv+a/5r/mv+Z/5n/mf+Z/5n/mf+Z/5j/mP+Y/5j/mP+Y/5j/l/+X/5f/l/+X/5f/l/+W/5b/lv+W/5b/lv+W/5X/lf+V/5X/lf+V/5X/lP+U/5T/lP+U/5T/lP+T/5P/k/+T/5P/k/+T/5L/kv+S/5L/kv+S/5L/kf+R/5H/kf+R/5H/kf+Q/5D/kP+Q/5D/kP+Q/4//j/+P/4//j/+P/4//jv+O/47/jv+O/47/jv+N/43/jf+N/43/jf+N/4z/jP+M/4z/jP+M/4z/i/+L/4v/i/+L/4v/i/+K/4r/iv+K/4r/iv+K/4n/if+J/4n/if+J/4n/iP+I/4j/iP+I/4j/iP+H/4f/h/+H/4f/h/+H/4b/hv+G/4b/hv+G/4b/hf+F/4X/hf+F/4X/hf+E/4T/hP+E/4T/hP+E/4P/g/+D/4P/g/+D/4P/gv+C/4L/gv+C/4L/gv+B/4H/gf+B/4H/gf+B/4D/gP+A/4D/gP+A/4D/f/9//3//f/9//3//f/9+/37/fv9+/37/fv9+/33/ff99/33/ff99/33/fP98/3z/fP98/3z/fP97/3v/e/97/3v/e/97/3r/ev96/3r/ev96/3r/ef95/3n/ef95/3n/ef94/3j/eP94/3j/eP94/3f/d/93/3f/d/93/3f/dv92/3b/dv92/3b/dv91/3X/df91/3X/df91/3T/dP90/3T/dP90/3T/c/9z/3P/c/9z/3P/c/9y/3L/cv9y/3L/cv9y/3H/cf9x/3H/cf9x/3H/cP9w/3D/cP9w/3D/cP9v/2//b/9v/2//b/9v/27/bv9u/27/bv9u/27/bf9t/23/bf9t/23/bf9s/2z/bP9s/2z/bP9s/2v/a/9r/2v/a/9r/2v/av9q/2r/av9q/2r/av9p/2n/af9p/2n/af9p/2j/aP9o/2j/aP9o/2j/Z/9n/2f/Z/9n/2f/Z/9m/2b/Zv9m/2b/Zv9m/2X/Zf9l/2X/Zf9l/2X/ZP9k/2T/ZP9k/2T/ZP9j/2P/Y/9j/2P/Y/9j/2L/Yv9i/2L/Yv9i/2L/Yf9h/2H/Yf9h/2H/Yf9g/2D/YP9g/2D/YP9g/1//X/9f/1//X/9f/1//Xv9e/17/Xv9e/17/Xv9d/13/Xf9d/13/Xf9d/1z/XP9c/1z/XP9c/1z/W/9b/1v/W/9b/1v/W/9a/1r/Wv9a/1r/Wv9a/1n/Wf9Z/1n/Wf9Z/1n/WP9Y/1j/WP9Y/1j/WP9X/1f/V/9X/1f/V/9X/1b/Vv9W/1b/Vv9W/1b/Vf9V/1X/Vf9V/1X/Vf9U/1T/VP9U/1T/VP9U/1P/U/9T/1P/U/9T/1P/Uv9S/1L/Uv9S/1L/Uv9R/1H/Uf9R/1H/Uf9R/1D/UP9Q/1D/UP9Q/1D/T/9P/0//T/9P/0//T/9O/07/Tv9O/07/Tv9O/03/Tf9N/03/Tf9N/03/TP9M/0z/TP9M/0z/TP9L/0v/S/9L/0v/S/9L/0r/Sv9K/0r/Sv9K/0r/Sf9J/0n/Sf9J/0n/Sf9I/0j/SP9I/0j/SP9I/0f/R/9H/0f/R/9H/0f/Rv9G/0b/Rv9G/0b/Rv9F/0X/Rf9F/0X/Rf9F/0T/RP9E/0T/RP9E/0T/Q/9D/0P/Q/9D/0P/Q/9C/0L/Qv9C/0L/Qv9C/0H/Qf9B/0H/Qf9B/0H/QP9A/0D/QP9A/0D/QP8//z//P/8//z//P/8//z7/Pv8+/z7/Pv8+/z7/Pf89/z3/Pf89/z3/Pf88/zz/PP88/zz/PP88/zv/O/87/zv/O/87/zv/Ov86/zr/Ov86/zr/Ov85/zn/Of85/zn/Of85/zj/OP84/zj/OP84/zj/N/83/zf/N/83/zf/N/82/zb/Nv82/zb/Nv82/zX/Nf81/zX/Nf81/zX/NP80/zT/NP80/zT/NP8z/zP/M/8z/zP/M/8z/zL/Mv8y/zL/Mv8y/zL/Mf8x/zH/Mf8x/zH/Mf8w/zD/MP8w/zD/MP8w/y//L/8v/y//L/8v/y//Lv8u/y7/Lv8u/y7/Lv8t/y3/Lf8t/y3/Lf8t/yz/LP8s/yz/LP8s/yz/K/8r/yv/K/8r/yv/K/8q/yr/Kv8q/yr/Kv8q/yn/Kf8p/yn/Kf8p/yn/KP8o/yj/KP8o/yj/KP8n/yf/J/8n/yf/J/8n/yb/Jv8m/yb/Jv8m/yb/Jf8l/yX/Jf8l/yX/Jf8k/yT/JP8k/yT/JP8k/yP/I/8j/yP/I/8j/yP/Iv8i/yL/Iv8i/yL/Iv8h/yH/If8h/yH/If8h/yD/IP8g/yD/IP8g/yD/H/8f/x//H/8f/x//H/8e/x7/Hv8e/x7/Hv8e/x3/Hf8d/x3/Hf8d/x3/HP8c/xz/HP8c/xz/HP8b/xv/G/8b/xv/G/8b/xr/Gv8a/xr/Gv8a/xr/Gf8Z/xn/Gf8Z/xn/Gf8Y/xj/GP8Y/xj/GP8Y/xf/F/8X/xf/F/8X/xf/Fv8W/xb/Fv8W/xb/Fv8V/xX/Ff8V/xX/Ff8V/xT/FP8U/xT/FP8U/xT/E/8T/xP/E/8T/xP/E/8S/xL/Ev8S/xL/Ev8S/xH/Ef8R/xH/Ef8R/xH/EP8Q/xD/EP8Q/xD/EP8P/w//D/8P/w//D/8P/w7/Dv8O/w7/Dv8O/w7/Df8N/w3/Df8N/w3/Df8M/wz/DP8M/wz/DP8M/wv/C/8L/wv/C/8L/wv/Cv8K/wr/Cv8K/wr/Cv8J/wn/Cf8J/wn/Cf8J/wj/CP8I/wj/CP8I/wj/B/8H/wf/B/8H/wf/B/8G/wb/Bv8G/wb/Bv8G/wX/Bf8F/wX/Bf8F/wX/BP8E/wT/BP8E/wT/BP8D/wP/A/8D/wP/A/8D/wL/Av8C/wL/Av8C/wL/Af8B/wH/Af8B/wH/Af8A/wD/AP8A/wD/AP8A//7//v/+//7//v/+//7//f/9//3//f/9//3//f/8//z//P/8//z//P/8//v/+//7//v/+//7//v/+v/6//r/+v/6//r/+v/5//n/+f/5//n/+f/5//j/+P/4//j/+P/4//j/9//3//f/9//3//f/9//2//b/9v/2//b/9v/2//X/9f/1//X/9f/1//X/9P/0//T/9P/0//T/9P/z//P/8//z//P/8//z//L/8v/y//L/8v/y//L/8f/x//H/8f/x//H/8f/w//D/8P/w//D/8P/w/+//7//v/+//7//v/+//7v/u/+7/7v/u/+7/7v/t/+3/7f/t/+3/7f/t/+z/7P/s/+z/7P/s/+z/6//r/+v/6//r/+v/6//q/+r/6v/q/+r/6v/q/+n/6f/p/+n/6f/p/+n/6P/o/+j/6P/o/+j/6P/n/+f/5//n/+f/5//n/+b/5v/m/+b/5v/m/+b/5f/l/+X/5f/l/+X/5f/k/+T/5P/k/+T/5P/k/+P/4//j/+P/4//j/+P/4v/i/+L/4v/i/+L/4v/h/+H/4f/h/+H/4f/h/+D/4P/g/+D/4P/g/+D/3//f/9//3//f/9//3//e/97/3v/e/97/3v/e/93/3f/d/93/3f/d/93/3P/c/9z/3P/c/9z/3P/b/9v/2//b/9v/2//b/9r/2v/a/9r/2v/a/9r/2f/Z/9n/2f/Z/9n/2f/Y/9j/2P/Y/9j/2P/Y/9f/1//X/9f/1//X/9f/1v/W/9b/1v/W/9b/1v/V/9X/1f/V/9X/1f/V/9T/1P/U/9T/1P/U/9T/0//T/9P/0//T/9P/0//S/9L/0v/S/9L/0v/S/9H/0f/R/9H/0f/R/9H/0P/Q/9D/0P/Q/9D/0P/P/8//z//P/8//z//P/87/zv/O/87/zv/O/87/zf/N/83/zf/N/83/zf/M/8z/zP/M/8z/zP/M/8v/y//L/8v/y//L/8v/yv/K/8r/yv/K/8r/yv/J/8n/yf/J/8n/yf/J/8j/yP/I/8j/yP/I/8j/x//H/8f/x//H/8f/x//G/8b/xv/G/8b/xv/G/8X/xf/F/8X/xf/F/8X/xP/E/8T/xP/E/8T/xP/D/8P/w//D/8P/w//D/8L/wv/C/8L/wv/C/8L/wf/B/8H/wf/B/8H/wf/A/8D/wP/A/8D/wP/A/7//v/+//7//v/+//7//vv++/77/vv++/77/vv+9/73/vf+9/73/vf+9/7z/vP+8/7z/vP+8/7z/u/+7/7v/u/+7/7v/u/+6/7r/uv+6/7r/uv+6/7n/uf+5/7n/uf+5/7n/uP+4/7j/uP+4/7j/uP+3/7f/t/+3/7f/t/+3/7b/tv+2/7b/tv+2/7b/tf+1/7X/tf+1/7X/tf+0/7T/tP+0/7T/tP+0/7P/s/+z/7P/s/+z/7P/sv+y/7L/sv+y/7L/sv+x/7H/sf+x/7H/sf+x/7D/sP+w/7D/sP+w/7D/r/+v/6//r/+v/6//r/+u/67/rv+u/67/rv+u/63/rf+t/63/rf+t/63/rP+s/6z/rP+s/6z/rP+r/6v/q/+r/6v/q/+r/6r/qv+q/6r/qv+q/6r/qf+p/6n/qf+p/6n/qf+o/6j/qP+o/6j/qP+o/6f/p/+n/6f/p/+n/6f/pv+m/6b/pv+m/6b/pv+l/6X/pf+l/6X/pf+l/6T/pP+k/6T/pP+k/6T/o/+j/6P/o/+j/6P/o/+i/6L/ov+i/6L/ov+i/6H/of+h/6H/of+h/6H/oP+g/6D/oP+g/6D/oP+f/5//n/+f/5//n/+f/57/nv+e/57/nv+e/57/nf+d/53/nf+d/53/nf+c/5z/nP+c/5z/nP+c/5v/m/+b/5v/m/+b/5v/mv+a/5r/mv+a/5r/mv+Z/5n/mf+Z/5n/mf+Z/5j/mP+Y/5j/mP+Y/5j/l/+X/5f/l/+X/5f/l/+W/5b/lv+W/5b/lv+W/5X/lf+V/5X/lf+V/5X/lP+U/5T/lP+U/5T/lP+T/5P/k/+T/5P/k/+T/5L/kv+S/5L/kv+S/5L/kf+R/5H/kf+R/5H/kf+Q/5D/kP+Q/5D/kP+Q/4//j/+P/4//j/+P/4//jv+O/47/jv+O/47/jv+N/43/jf+N/43/jf+N/4z/jP+M/4z/jP+M/4z/i/+L/4v/i/+L/4v/i/+K/4r/iv+K/4r/iv+K/4n/if+J/4n/if+J/4n/iP+I/4j/iP+I/4j/iP+H/4f/h/+H/4f/h/+H/4b/hv+G/4b/hv+G/4b/hf+F/4X/hf+F/4X/hf+E/4T/hP+E/4T/hP+E/4P/g/+D/4P/g/+D/4P/gv+C/4L/gv+C/4L/gv+B/4H/gf+B/4H/gf+B/4D/gP+A/4D/gP+A/4D/f/9//3//f/9//3//f/9+/37/fv9+/37/fv9+/33/ff99/33/ff99/33/fP98/3z/fP98/3z/fP97/3v/e/97/3v/e/97/3r/ev96/3r/ev96/3r/ef95/3n/ef95/3n/ef94/3j/eP94/3j/eP94/3f/d/93/3f/d/93/3f/dv92/3b/dv92/3b/dv91/3X/df91/3X/df91/3T/dP90/3T/dP90/3T/c/9z/3P/c/9z/3P/c/9y/3L/cv9y/3L/cv9y/3H/cf9x/3H/cf9x/3H/cP9w/3D/cP9w/3D/cP9v/2//b/9v/2//b/9v/27/bv9u/27/bv9u/27/bf9t/23/bf9t/23/bf9s/2z/bP9s/2z/bP9s/2v/a/9r/2v/a/9r/2v/av9q/2r/av9q/2r/av9p/2n/af9p/2n/af9p/2j/aP9o/2j/aP9o/2j/Z/9n/2f/Z/9n/2f/Z/9m/2b/Zv9m/2b/Zv9m/2X/Zf9l/2X/Zf9l/2X/ZP9k/2T/ZP9k/2T/ZP9j/2P/Y/9j/2P/Y/9j/2L/Yv9i/2L/Yv9i/2L/Yf9h/2H/Yf9h/2H/Yf9g/2D/YP9g/2D/YP9g/1//X/9f/1//X/9f/1//Xv9e/17/Xv9e/17/Xv9d/13/Xf9d/13/Xf9d/1z/XP9c/1z/XP9c/1z/W/9b/1v/W/9b/1v/W/9a/1r/Wv9a/1r/Wv9a/1n/Wf9Z/1n/Wf9Z/1n/WP9Y/1j/WP9Y/1j/WP9X/1f/V/9X/1f/V/9X/1b/Vv9W/1b/Vv9W/1b/Vf9V/1X/Vf9V/1X/Vf9U/1T/VP9U/1T/VP9U/1P/U/9T/1P/U/9T/1P/Uv9S/1L/Uv9S/1L/Uv9R/1H/Uf9R/1H/Uf9R/1D/UP9Q/1D/UP9Q/1D/T/9P/0//T/9P/0//T/9O/07/Tv9O/07/Tv9O/03/Tf9N/03/Tf9N/03/TP9M/0z/TP9M/0z/TP9L/0v/S/9L/0v/S/9L/0r/Sv9K/0r/Sv9K/0r/Sf9J/0n/Sf9J/0n/Sf9I/0j/SP9I/0j/SP9I/0f/R/9H/0f/R/9H/0f/Rv9G/0b/Rv9G/0b/Rv9F/0X/Rf9F/0X/Rf9F/0T/RP9E/0T/RP9E/0T/Q/9D/0P/Q/9D/0P/Q/9C/0L/Qv9C/0L/Qv9C/0H/Qf9B/0H/Qf9B/0H/QP9A/0D/QP9A/0D/QP8//z//P/8//z//P/8//z7/Pv8+/z7/Pv8+/z7/Pf89/z3/Pf89/z3/Pf88/zz/PP88/zz/PP88/zv/O/87/zv/O/87/zv/Ov86/zr/Ov86/zr/Ov85/zn/Of85/zn/Of85/zj/OP84/zj/OP84/zj/N/83/zf/N/83/zf/N/82/zb/Nv82/zb/Nv82/zX/Nf81/zX/Nf81/zX/NP80/zT/NP80/zT/NP8z/zP/M/8z/zP/M/8z/zL/Mv8y/zL/Mv8y/zL/Mf8x/zH/Mf8x/zH/Mf8w/zD/MP8w/zD/MP8w/y//L/8v/y//L/8v/y//Lv8u/y7/Lv8u/y7/Lv8t/y3/Lf8t/y3/Lf8t/yz/LP8s/yz/LP8s/yz/K/8r/yv/K/8r/yv/K/8q/yr/Kv8q/yr/Kv8q/yn/Kf8p/yn/Kf8p/yn/KP8o/yj/KP8o/yj/KP8n/yf/J/8n/yf/J/8n/yb/Jv8m/yb/Jv8m/yb/Jf8l/yX/Jf8l/yX/Jf8k/yT/JP8k/yT/JP8k/yP/I/8j/yP/I/8j/yP/Iv8i/yL/Iv8i/yL/Iv8h/yH/If8h/yH/If8h/yD/IP8g/yD/IP8g/yD/H/8f/x//H/8f/x//H/8e/x7/Hv8e/x7/Hv8e/x3/Hf8d/x3/Hf8d/x3/HP8c/xz/HP8c/xz/HP8b/xv/G/8b/xv/G/8b/xr/Gv8a/xr/Gv8a/xr/Gf8Z/xn/Gf8Z/xn/Gf8Y/xj/GP8Y/xj/GP8Y/xf/F/8X/xf/F/8X/xf/Fv8W/xb/Fv8W/xb/Fv8V/xX/Ff8V/xX/Ff8V/xT/FP8U/xT/FP8U/xT/E/8T/xP/E/8T/xP/E/8S/xL/Ev8S/xL/Ev8S/xH/Ef8R/xH/Ef8R/xH/EP8Q/xD/EP8Q/xD/EP8P/w//D/8P/w//D/8P/w7/Dv8O/w7/Dv8O/w7/Df8N/w3/Df8N/w3/Df8M/wz/DP8M/wz/DP8M/wv/C/8L/wv/C/8L/wv/Cv8K/wr/Cv8K/wr/Cv8J/wn/Cf8J/wn/Cf8J/wj/CP8I/wj/CP8I/wj/B/8H/wf/B/8H/wf/B/8G/wb/Bv8G/wb/Bv8G/wX/Bf8F/wX/Bf8F/wX/BP8E/wT/BP8E/wT/BP8D/wP/A/8D/wP/A/8D/wL/Av8C/wL/Av8C/wL/Af8B/wH/Af8B/wH/Af8A/wD/AP8A/wD/AP8A//7//v/+//7//v/+//7//f/9//3//f/9//3//f/8//z//P/8//z//P/8//v/+//7//v/+//7//v/+v/6//r/+v/6//r/+v/5//n/+f/5//n/+f/5//j/+P/4//j/+P/4//j/9//3//f/9//3//f/9//2//b/9v/2//b/9v/2//X/9f/1//X/9f/1//X/9P/0//T/9P/0//T/9P/z//P/8//z//P/8//z//L/8v/y//L/8v/y//L/8f/x//H/8f/x//H/8f/w//D/8P/w//D/8P/w/+//7//v/+//7//v/+//7v/u/+7/7v/u/+7/7v/t/+3/7f/t/+3/7f/t/+z/7P/s/+z/7P/s/+z/6//r/+v/6//r/+v/6//q/+r/6v/q/+r/6v/q/+n/6f/p/+n/6f/p/+n/6P/o/+j/6P/o/+j/6P/n/+f/5//n/+f/5//n/+b/5v/m/+b/5v/m/+b/5f/l/+X/5f/l/+X/5f/k/+T/5P/k/+T/5P/k/+P/4//j/+P/4//j/+P/4v/i/+L/4v/i/+L/4v/h/+H/4f/h/+H/4f/h/+D/4P/g/+D/4P/g/4A=";

interface UseWaiterNotificationsProps {
  outletId?: string;
  enabled?: boolean;
}

export function useWaiterNotifications({ outletId, enabled = true }: UseWaiterNotificationsProps) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_BASE64);
    audioRef.current.volume = 0.8;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
      });
    }
  }, []);

  useEffect(() => {
    if (!outletId || !enabled) return;

    const channel = supabase
      .channel(`waiter-orders-${outletId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pos_orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as { id: string; order_number: string; status: string; table_number?: string };
          const oldOrder = payload.old as { status: string };
          
          // Notify when order status changes to "ready"
          if (updatedOrder.status === "ready" && oldOrder.status !== "ready") {
            // Skip notification on initial load
            if (!isInitialLoadRef.current) {
              playNotificationSound();
              
              const orderInfo = updatedOrder.table_number 
                ? `Table ${updatedOrder.table_number}` 
                : `Order #${updatedOrder.order_number.split("-").pop()}`;
              
              toast({
                title: "🍽️ Order Ready!",
                description: `${orderInfo} is ready for pickup`,
                duration: 8000,
              });
            }
          }
          
          // Invalidate queries to refresh the display
          queryClient.invalidateQueries({ queryKey: ["waiter-orders", outletId] });
          queryClient.invalidateQueries({ queryKey: ["waiter-stats", outletId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pos_orders",
          filter: `outlet_id=eq.${outletId}`,
        },
        () => {
          // New order - refresh the display
          queryClient.invalidateQueries({ queryKey: ["waiter-orders", outletId] });
          queryClient.invalidateQueries({ queryKey: ["waiter-stats", outletId] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Mark initial load as complete after a short delay
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      isInitialLoadRef.current = true;
    };
  }, [outletId, enabled, queryClient, playNotificationSound]);

  return {
    playNotificationSound,
  };
}
