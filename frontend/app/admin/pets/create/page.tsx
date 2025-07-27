'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './create.module.css';
import { SkillEffects } from '@/lib/types';

interface CreatePetForm {
  name: string;
  img: string;
  description: string;
  element: string;
  rarity: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseAccuracy: number;
  baseEvasion: number;
  baseCriticalRate: number;
  isStarter: boolean;
}

interface SkillForm {
  normal: { 
    name: string; 
    description: string; 
    power: number; 
    energyCost: number;
    accuracy: number;
    criticalRate: number;
    effects?: SkillEffects;
  };
  ultimate: { 
    name: string; 
    description: string; 
    power: number; 
    energyCost: number;
    accuracy: number;
    criticalRate: number;
    effects?: SkillEffects;
  };
  passive: { 
    name: string; 
    description: string;
    effects?: SkillEffects;
  };
}

export default function CreatePet() {
  const { getToken, isAdmin } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreatePetForm>({
    name: '',
    img: '',
    description: '',
    element: '',
    rarity: 'common',
    baseHp: 1000,
    baseAttack: 100,
    baseDefense: 50,
    baseSpeed: 100,
    baseAccuracy: 100,
    baseEvasion: 10,
    baseCriticalRate: 5,
    isStarter: false
  });

  const [createSkills, setCreateSkills] = useState(false);
  const [skillForm, setSkillForm] = useState<SkillForm>({
    normal: { 
      name: '', 
      description: '', 
      power: 0, 
      energyCost: 20,
      accuracy: 90,
      criticalRate: 5
    },
    ultimate: { 
      name: '', 
      description: '', 
      power: 0, 
      energyCost: 50,
      accuracy: 80,
      criticalRate: 15
    },
    passive: { 
      name: '', 
      description: '' 
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('base') ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        return;
      }

      // Tạo pet trước
      const createdPet = await adminAPI.createPet(token, formData);
      
      // Nếu có tạo skill thì tạo skill set
      if (createSkills) {
        try {
          await adminAPI.createSkillSet(token, {
            petId: createdPet._id,
            skillSet: skillForm
          });
        } catch (skillErr: any) {
          console.error('Create skill set error:', skillErr);
          // Không dừng lại nếu tạo skill thất bại, chỉ log lỗi
        }
      }

      router.push('/admin/pets');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo linh thú');
      console.error('Create pet error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Không có quyền truy cập</h2>
          <p>Bạn cần quyền admin để truy cập trang này.</p>
          <Link href="/" className={styles.button}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tạo Linh thú mới</h1>
        <Link href="/admin/pets" className={styles.backButton}>
          ← Quay lại
        </Link>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên linh thú *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Nhập tên linh thú..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="img">URL hình ảnh *</label>
            <input
              type="url"
              id="img"
              name="img"
              value={formData.img}
              onChange={handleInputChange}
              required
              placeholder="https://example.com/pet-image.jpg"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Mô tả về linh thú..."
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="element">Hệ *</label>
              <select
                id="element"
                name="element"
                value={formData.element}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn hệ</option>
                <option value="fire">Hỏa</option>
                <option value="water">Thủy</option>
                <option value="wind">Phong</option>
                <option value="thunder">Lôi</option>
                <option value="ice">Băng</option>
                <option value="grass">Thảo</option>
                <option value="rock">Nham</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rarity">Độ hiếm *</label>
              <select
                id="rarity"
                name="rarity"
                value={formData.rarity}
                onChange={handleInputChange}
                required
              >
                <option value="common">Thường</option>
                <option value="rare">Hiếm</option>
                <option value="epic">Siêu hiếm</option>
                <option value="legendary">Huyền thoại</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isStarter"
                checked={formData.isStarter}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isStarter: e.target.checked
                }))}
              />
              🌟 Linh thú mở đầu (Starter Pet)
            </label>
            <small>Đánh dấu linh thú này là lựa chọn mở đầu cho người dùng mới</small>
          </div>

          <div className={styles.statsSection}>
            <h3>Chỉ số cơ bản</h3>
            <div className={styles.statsGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="baseHp">HP</label>
                <input
                  type="number"
                  id="baseHp"
                  name="baseHp"
                  value={formData.baseHp}
                  onChange={handleInputChange}
                  min="1"
                  max="9999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseAttack">Tấn công</label>
                <input
                  type="number"
                  id="baseAttack"
                  name="baseAttack"
                  value={formData.baseAttack}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseDefense">Phòng thủ</label>
                <input
                  type="number"
                  id="baseDefense"
                  name="baseDefense"
                  value={formData.baseDefense}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseSpeed">Tốc độ</label>
                <input
                  type="number"
                  id="baseSpeed"
                  name="baseSpeed"
                  value={formData.baseSpeed}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseAccuracy">Độ chính xác</label>
                <input
                  type="number"
                  id="baseAccuracy"
                  name="baseAccuracy"
                  value={formData.baseAccuracy}
                  onChange={handleInputChange}
                  min="1"
                  max="200"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseEvasion">Né tránh</label>
                <input
                  type="number"
                  id="baseEvasion"
                  name="baseEvasion"
                  value={formData.baseEvasion}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseCriticalRate">Tỷ lệ chí mạng</label>
                <input
                  type="number"
                  id="baseCriticalRate"
                  name="baseCriticalRate"
                  value={formData.baseCriticalRate}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>

          <div className={styles.skillsSection}>
            <div className={styles.skillsHeader}>
              <h3>Kỹ năng của linh thú</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={createSkills}
                  onChange={(e) => setCreateSkills(e.target.checked)}
                />
                Tạo skill cho linh thú này
              </label>
            </div>

            {createSkills && (
              <div className={styles.skillsForm}>
                <div className={styles.skillTypeSection}>
                  <h4>Normal Skill *</h4>
                  <input
                    type="text"
                    placeholder="Tên skill"
                    value={skillForm.normal.name}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      normal: { ...prev.normal, name: e.target.value }
                    }))}
                    required={createSkills}
                  />
                  <textarea
                    placeholder="Mô tả"
                    value={skillForm.normal.description}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      normal: { ...prev.normal, description: e.target.value }
                    }))}
                    required={createSkills}
                  />
                  <div className={styles.skillInputs}>
                    <div className={styles.inputGroup}>
                      <label>⚔️ Power</label>
                      <input
                        type="number"
                        placeholder="Power"
                        value={skillForm.normal.power}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          normal: { ...prev.normal, power: parseInt(e.target.value) || 0 }
                        }))}
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>⚡ Energy Cost</label>
                      <input
                        type="number"
                        placeholder="Energy Cost"
                        value={skillForm.normal.energyCost}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          normal: { ...prev.normal, energyCost: parseInt(e.target.value) || 0 }
                        }))}
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>🎯 Accuracy (%)</label>
                      <input
                        type="number"
                        placeholder="Accuracy"
                        value={skillForm.normal.accuracy}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          normal: { ...prev.normal, accuracy: parseInt(e.target.value) || 0 }
                        }))}
                        min="0"
                        max="100"
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>💥 Critical Rate (%)</label>
                      <input
                        type="number"
                        placeholder="Critical Rate"
                        value={skillForm.normal.criticalRate}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          normal: { ...prev.normal, criticalRate: parseInt(e.target.value) || 0 }
                        }))}
                        min="0"
                        max="100"
                        required={createSkills}
                      />
                    </div>
                  </div>
                  
                  {/* Effects Section for Normal Skill */}
                  <div className={styles.effectsSection}>
                    <h5>Hiệu ứng đặc biệt</h5>
                    
                    {/* Status Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Status Effects</h6>
                      <div className={styles.effectsGrid}>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.normal.effects?.status?.stun || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  status: {
                                    ...prev.normal.effects?.status,
                                    stun: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          💫 Stun
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.normal.effects?.status?.poison || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  status: {
                                    ...prev.normal.effects?.status,
                                    poison: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ☠️ Poison
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.normal.effects?.status?.burn || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  status: {
                                    ...prev.normal.effects?.status,
                                    burn: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          🔥 Burn
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.normal.effects?.status?.freeze || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  status: {
                                    ...prev.normal.effects?.status,
                                    freeze: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ❄️ Freeze
                        </label>
                      </div>
                    </div>

                    {/* Special Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Special Effects</h6>
                      <div className={styles.specialEffectsGrid}>
                        <div className={styles.specialEffectInput}>
                          <label>💚 Heal (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.normal.effects?.special?.heal || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  special: {
                                    ...prev.normal.effects?.special,
                                    heal: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.specialEffectInput}>
                          <label>🩸 Drain (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.normal.effects?.special?.drain || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  special: {
                                    ...prev.normal.effects?.special,
                                    drain: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Buff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.buff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  buff: {
                                    ...prev.normal.effects?.buff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.buff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  buff: {
                                    ...prev.normal.effects?.buff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.buff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  buff: {
                                    ...prev.normal.effects?.buff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Debuff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Debuff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.debuff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  debuff: {
                                    ...prev.normal.effects?.debuff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.debuff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  debuff: {
                                    ...prev.normal.effects?.debuff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.normal.effects?.debuff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              normal: {
                                ...prev.normal,
                                effects: {
                                  ...prev.normal.effects,
                                  debuff: {
                                    ...prev.normal.effects?.debuff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.skillTypeSection}>
                  <h4>Ultimate Skill *</h4>
                  <input
                    type="text"
                    placeholder="Tên skill"
                    value={skillForm.ultimate.name}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      ultimate: { ...prev.ultimate, name: e.target.value }
                    }))}
                    required={createSkills}
                  />
                  <textarea
                    placeholder="Mô tả"
                    value={skillForm.ultimate.description}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      ultimate: { ...prev.ultimate, description: e.target.value }
                    }))}
                    required={createSkills}
                  />
                  <div className={styles.skillInputs}>
                    <div className={styles.inputGroup}>
                      <label>⚔️ Power</label>
                      <input
                        type="number"
                        placeholder="Power"
                        value={skillForm.ultimate.power}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          ultimate: { ...prev.ultimate, power: parseInt(e.target.value) || 0 }
                        }))}
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>⚡ Energy Cost</label>
                      <input
                        type="number"
                        placeholder="Energy Cost"
                        value={skillForm.ultimate.energyCost}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          ultimate: { ...prev.ultimate, energyCost: parseInt(e.target.value) || 0 }
                        }))}
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>🎯 Accuracy (%)</label>
                      <input
                        type="number"
                        placeholder="Accuracy"
                        value={skillForm.ultimate.accuracy}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          ultimate: { ...prev.ultimate, accuracy: parseInt(e.target.value) || 0 }
                        }))}
                        min="0"
                        max="100"
                        required={createSkills}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>💥 Critical Rate (%)</label>
                      <input
                        type="number"
                        placeholder="Critical Rate"
                        value={skillForm.ultimate.criticalRate}
                        onChange={(e) => setSkillForm(prev => ({
                          ...prev,
                          ultimate: { ...prev.ultimate, criticalRate: parseInt(e.target.value) || 0 }
                        }))}
                        min="0"
                        max="100"
                        required={createSkills}
                      />
                    </div>
                  </div>
                  
                  {/* Effects Section for Ultimate Skill */}
                  <div className={styles.effectsSection}>
                    <h5>Hiệu ứng đặc biệt</h5>
                    
                    {/* Status Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Status Effects</h6>
                      <div className={styles.effectsGrid}>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.ultimate.effects?.status?.stun || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  status: {
                                    ...prev.ultimate.effects?.status,
                                    stun: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          💫 Stun
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.ultimate.effects?.status?.poison || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  status: {
                                    ...prev.ultimate.effects?.status,
                                    poison: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ☠️ Poison
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.ultimate.effects?.status?.burn || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  status: {
                                    ...prev.ultimate.effects?.status,
                                    burn: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          🔥 Burn
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.ultimate.effects?.status?.freeze || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  status: {
                                    ...prev.ultimate.effects?.status,
                                    freeze: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ❄️ Freeze
                        </label>
                      </div>
                    </div>

                    {/* Special Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Special Effects</h6>
                      <div className={styles.specialEffectsGrid}>
                        <div className={styles.specialEffectInput}>
                          <label>💚 Heal (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.ultimate.effects?.special?.heal || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  special: {
                                    ...prev.ultimate.effects?.special,
                                    heal: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.specialEffectInput}>
                          <label>🩸 Drain (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.ultimate.effects?.special?.drain || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  special: {
                                    ...prev.ultimate.effects?.special,
                                    drain: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Buff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.buff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  buff: {
                                    ...prev.ultimate.effects?.buff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.buff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  buff: {
                                    ...prev.ultimate.effects?.buff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.buff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  buff: {
                                    ...prev.ultimate.effects?.buff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Debuff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Debuff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.debuff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  debuff: {
                                    ...prev.ultimate.effects?.debuff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.debuff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  debuff: {
                                    ...prev.ultimate.effects?.debuff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.ultimate.effects?.debuff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              ultimate: {
                                ...prev.ultimate,
                                effects: {
                                  ...prev.ultimate.effects,
                                  debuff: {
                                    ...prev.ultimate.effects?.debuff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.skillTypeSection}>
                  <h4>Passive Skill (Tùy chọn)</h4>
                  <input
                    type="text"
                    placeholder="Tên skill"
                    value={skillForm.passive.name}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      passive: { ...prev.passive, name: e.target.value }
                    }))}
                  />
                  <textarea
                    placeholder="Mô tả"
                    value={skillForm.passive.description}
                    onChange={(e) => setSkillForm(prev => ({
                      ...prev,
                      passive: { ...prev.passive, description: e.target.value }
                    }))}
                  />
                  
                  {/* Effects Section for Passive Skill */}
                  <div className={styles.effectsSection}>
                    <h5>Hiệu ứng đặc biệt</h5>
                    
                    {/* Status Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Status Effects</h6>
                      <div className={styles.effectsGrid}>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.passive.effects?.status?.stun || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  status: {
                                    ...prev.passive.effects?.status,
                                    stun: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          💫 Stun
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.passive.effects?.status?.poison || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  status: {
                                    ...prev.passive.effects?.status,
                                    poison: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ☠️ Poison
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.passive.effects?.status?.burn || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  status: {
                                    ...prev.passive.effects?.status,
                                    burn: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          🔥 Burn
                        </label>
                        <label className={styles.effectCheckbox}>
                          <input
                            type="checkbox"
                            checked={skillForm.passive.effects?.status?.freeze || false}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  status: {
                                    ...prev.passive.effects?.status,
                                    freeze: e.target.checked
                                  }
                                }
                              }
                            }))}
                          />
                          ❄️ Freeze
                        </label>
                      </div>
                    </div>

                    {/* Special Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Special Effects</h6>
                      <div className={styles.specialEffectsGrid}>
                        <div className={styles.specialEffectInput}>
                          <label>💚 Heal (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.passive.effects?.special?.heal || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  special: {
                                    ...prev.passive.effects?.special,
                                    heal: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.specialEffectInput}>
                          <label>🩸 Drain (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={skillForm.passive.effects?.special?.drain || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  special: {
                                    ...prev.passive.effects?.special,
                                    drain: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Buff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.buff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  buff: {
                                    ...prev.passive.effects?.buff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.buff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  buff: {
                                    ...prev.passive.effects?.buff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed +</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.buff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  buff: {
                                    ...prev.passive.effects?.buff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Debuff Effects */}
                    <div className={styles.effectsGroup}>
                      <h6>Debuff Effects</h6>
                      <div className={styles.buffEffectsGrid}>
                        <div className={styles.buffEffectInput}>
                          <label>⚔️ Attack -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.debuff?.attack || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  debuff: {
                                    ...prev.passive.effects?.debuff,
                                    attack: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>🛡️ Defense -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.debuff?.defense || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  debuff: {
                                    ...prev.passive.effects?.debuff,
                                    defense: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                        <div className={styles.buffEffectInput}>
                          <label>⚡ Speed -</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={skillForm.passive.effects?.debuff?.speed || 0}
                            onChange={(e) => setSkillForm(prev => ({
                              ...prev,
                              passive: {
                                ...prev.passive,
                                effects: {
                                  ...prev.passive.effects,
                                  debuff: {
                                    ...prev.passive.effects?.debuff,
                                    speed: parseInt(e.target.value) || 0
                                  }
                                }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/admin/pets')}
              className={styles.cancelButton}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo linh thú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 